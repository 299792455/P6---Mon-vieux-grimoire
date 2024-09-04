const Book = require('../models/books');

exports.createBook = (req, res, next) => {
    const book = new Book({
        _id: req.params.id,
        title:req.params.title,
        author:req.params.author,
        imageUrl:req.params.imageURl,
        year: req.params.year,
        genre:req.params.genre,
        ratings:req.params.ratings,
        averageRating:req.params.averageRating,
    });
    book.save()
    .then(() => {
          res.status(201).json({
            message: 'Book saved successfully!'
          });
        })
        .catch(
        (error) => {
          res.status(400).json({
            error: error
          });
        }
      );
};

exports.getAllBook = (req, res, next) => {
    Book.find()
      .then(books => res.status(200).json({ books }))
      .catch(error => res.status(400).json({ error }));
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
      .then(book => res.status(200).json({ book }))
      .catch(error => res.status(404).json({ error }));
  };

exports.modifyBook = (req, res, next) => {
    const book = new Book({
        _id: req.params.id,
        title:req.params.title,
        author:req.params.author,
        imageUrl:req.params.imageURl,
        year: req.params.year,
        genre:req.params.genre,
        ratings:req.params.ratings,
        averageRating:req.params.averageRating,
    });
    Book.updateOne({_id:req.params.id}, book)
    .then (
        () => {
          res.status(201).json({
            message: 'Book updated successfully!'
          });
        })
    .catch(
            (error) => {
              res.status(400).json({
                error: error
              });
            });
};


exports.deleteBook = (req, res, next) => {
    Book.deleteOne({id:req.params.id})
    .then (
        () => {
          res.status(201).json({
            message: 'Book deleted successfully!'
          });
        })
    .catch(
            (error) => {
              res.status(400).json({
                error: error
              });
            });
    };

