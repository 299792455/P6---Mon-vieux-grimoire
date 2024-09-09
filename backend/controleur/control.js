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
    Book.findOne({_id: req.params.id})
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message : 'Not authorized'});
            } else {
              Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
              .then(() => res.status(200).json({ message: 'Book updated successfully!', book: { ...bookObject, _id: req.params.id }}))
              .catch(error => res.status(401).json({ error }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
 };

 exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: 'Not authorized' });
      } else {
        const filename = book.imageUrl.split('/images/')[1];
        // Vérifie si le fichier existe avant de le supprimer
        if (fs.existsSync(`images/${filename}`)) {
          fs.unlink(`images/${filename}`, (err) => {
            if (err) {
              return res.status(500).json({ error: err });
            }
            Book.deleteOne({ _id: req.params.id })
              .then(() => {
                res.status(200).json({ message: 'Book deleted successfully!' });
              })
              .catch(error => res.status(401).json({ error }));
          });
        } else {
          Book.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Book deleted, but image not found.' }))
            .catch(error => res.status(401).json({ error }));
        }
      }
    })
    .catch(error => res.status(500).json({ error }));
};