const Book = require('../models/books');
const fs = require ('fs');

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    const book = new Book({
      ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    });
    book.save()
  .then(() => {
    console.log('Book saved successfully');  // Ajoute un log ici
    res.status(201).json({ message: 'Book saved successfully!' });
  })
  .catch((error) => {
    console.error('Error saving book:', error);  // Log pour capturer les erreurs
    res.status(400).json({ error });
  });
};

exports.rateBook = (req, res, next) => {
  const rating = req.body.rating; // Note fournie par l'utilisateur
  const userId = req.auth.userId; // ID de l'utilisateur connecté

  if (rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'Rating should be between 0 and 5' });
}
  Book.findOne({ _id: req.params.id })
      .then(book => {
          if (!book) {
              return res.status(404).json({ message: 'Book not found' }); 
          }

          const existingRating = book.ratings.find(rating => rating.userId === userId);
          if (existingRating) {
              return res.status(400).json({ message: 'User has already rated this book' });
          }

          book.ratings.push({ userId: userId, grade: rating });


          const totalRatings = book.ratings.reduce((sum, rating) => sum + rating.grade, 0);
          book.averageRating = parseFloat((totalRatings / book.ratings.length).toFixed(2));

          book.save()
              .then(() => res.status(200).json({ message: 'Rating added successfully', averageRating: book.averageRating }))
              .catch(error => res.status(400).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
};

exports.getAllBook = (req, res, next) => {
    Book.find()
      .then(books => res.status(200).json( books ))
      .catch(error => res.status(400).json( error ));
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
      .then(books => res.status(200).json(books))
      .catch(error => res.status(404).json(error));
  };

  exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    delete bookObject._userId;

    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId !== req.auth.userId) {
                return res.status(401).json({ message: 'Not authorized' });
            }

            // Delete old image if new image is uploaded
            if (req.file && book.imageUrl) {
                const oldFilename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${oldFilename}`, (err) => {
                    if (err) console.error('Failed to delete old image:', err);
                });
            }

            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Book updated successfully!', book: { ...bookObject, _id: req.params.id } }))
                .catch(error => res.status(401).json({ error }));
        })
        .catch(error => res.status(400).json({ error }));
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
      .then(book => {
          if (book.userId !== req.auth.userId) {
              return res.status(401).json({ message: 'Not authorized' });
          }

          const filename = book.imageUrl.split('/images/')[1];

          const deleteBookAndFile = () => {
              Book.deleteOne({ _id: req.params.id })
                  .then(() => res.status(200).json({ message: 'Book deleted successfully!' }))
                  .catch(error => res.status(401).json({ error }));
          };

          if (fs.existsSync(`images/${filename}`)) {
              fs.unlink(`images/${filename}`, (err) => {
                  if (err) return res.status(500).json({ error: err });
                  deleteBookAndFile();
              });
          } else {
              deleteBookAndFile();
          }
      })
      .catch(error => res.status(500).json({ error }));
};