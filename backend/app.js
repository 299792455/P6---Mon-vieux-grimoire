const express = require ('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const Book = require ('./models/books.js');

app.use(cors());

app.use(express.json())

mongoose.connect('mongodb+srv://75017pi:T5BYZOWTegrmGu9O@cluster6.gahlt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster6',
    { useNewUrlParser: true,
      useUnifiedTopology: true })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      next();
    });

    app.post('/api/books', (req, res, next) => {
        console.log(req.body);
        res.status(201).json({
          message:"ok usa c'est créé" //test pr route post pour plus tard (à changer)
        })
    });

    app.get('/api/books', (req, res, next) => {
        Book.find()
          .then(books => res.status(200).json({ books }))
          .catch(error => res.status(400).json({ error }));
    });

    app.get('/api/books/:id', (req, res, next) => {
        Book.findOne({ _id: req.params.id })
          .then(book => res.status(200).json({ book }))
          .catch(error => res.status(404).json({ error }));
      });

module.exports = app;

