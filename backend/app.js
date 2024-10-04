require ('dotenv').config();
const express = require ('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bookRoutes = require('./routes/routes.js');
const userRoutes = require ('./routes/user.js');
const path = require('path');



app.use(cors());

app.use(express.json());

mongoose.connect(process.env.URLBDD)
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      next();
    });

app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));


module.exports = app;

