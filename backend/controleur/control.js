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
    console.log('Book saved successfully');  
    res.status(201).json({ message: 'Book saved successfully!' });
  })
  .catch((error) => {
    console.error('Error saving book:', error);  
    res.status(400).json({ error });
  });
};

exports.rateBook = (req, res, next) => {
    const rating = req.body.rating; 
    const userId = req.auth.userId; 

    if (rating < 0 || rating > 5) {
        return res.status(400).json({ message: 'Rating should be between 0 and 5' });
    }

    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (!book) {
                return res.status(404).json({ message: 'Book not found' }); 
            }

            const existingRating = book.ratings.find(r => r.userId === userId);
            if (existingRating) {
                return res.status(400).json({ message: 'User has already rated this book' });
            }

            book.ratings.push({ userId, grade: rating });
            const totalRatings = book.ratings.reduce((sum, r) => sum + r.grade, 0);
            book.averageRating = parseFloat((totalRatings / book.ratings.length).toFixed(2));
            
            book.save()
                .then(updatedBook => res.status(200).json(updatedBook)) // Retourner l'objet complet
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

//.then(() => res.status(200).json({ message: 'Rating added successfully', averageRating: book.averageRating }))//

exports.getBestRatedBooks = (req, res, next) => {
    /*Book.aggregate([
        {
            // Ajouter un champ "averageRating" si ce n'est pas déjà calculé
            $addFields: {
                averageRating: { $avg: "$ratings.grade" }
            }
        },
        {
            // Trier les livres par la note moyenne décroissante
            $sort: { averageRating: -1 }
        },
        {
            // Limiter le résultat à 3 livres
            $limit: 3
        },
        {
            // Sélectionner uniquement les champs nécessaires
            $project: {
                title: 1,
                author: 1,
                genre: 1,
                imageUrl: 1,
                averageRating: 1
            }
        }
    ])
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error: 'Erreur lors de la récupération des livres avec les meilleures notes.' }));
    */
    Book.find()
    .sort({
        averageRating:-1
    })
    .limit(3)
    .then((books) => { 
        console.log('getBestRatedBooks', books)
        res.status(200).json( books )})
    .catch(error => res.status(400).json( error ));

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

            const userId = req.auth.userId; //Ne fonctionne pas en l'etat
            if (req.body.rating) {
                const rating = parseInt(req.body.rating);
                if (rating < 0 || rating > 5) {
                    return res.status(400).json({ message: 'Rating should be between 0 and 5' });
                }

                const existingRating = book.ratings.find(rating => rating.userId === userId);
                if (existingRating) {
                    return res.status(400).json({ message: 'User has already rated this book' });
                }

          
                book.ratings.push({ userId: userId, grade: rating });

            
                const totalRatings = book.ratings.reduce((sum, rating) => sum + rating.grade, 0);
                book.averageRating = parseFloat((totalRatings / book.ratings.length).toFixed(2));
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