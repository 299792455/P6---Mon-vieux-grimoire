// control.js
const Book = require('../models/books');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const path = require('path');

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg',
    'image/png': 'png',
};

// Fonction pour générer un nom de fichier unique
const generateFilename = (originalName, extension) => {
    const name = originalName.split(' ').join('_').split('.')[0];
    return `${name}_${Date.now()}.${extension}`;
};

exports.createBook = async (req, res, next) => {
    try {
        const bookObject = JSON.parse(req.body.book);
        delete bookObject._id;
        delete bookObject._userId;

        if (!req.file) {
            return res.status(400).json({ message: 'Image file is required' });
        }

        const extension = MIME_TYPES[req.file.mimetype];
        if (!extension) {
            return res.status(400).json({ message: 'Unsupported file type' });
        }

        const filename = generateFilename(req.file.originalname, extension);
        const filePath = path.join('images', filename);

        // Initialiser le pipeline Sharp avec redimensionnement et options de compression
        let imagePipeline = sharp(req.file.buffer)
            .resize({ width: 800, withoutEnlargement: true });

        // Appliquer des options spécifiques selon le format
        if (extension === 'jpeg' || extension === 'jpg') {
            imagePipeline = imagePipeline.jpeg({ quality: 70, mozjpeg: true });
        } else if (extension === 'png') {
            imagePipeline = imagePipeline.png({ compressionLevel: 8, adaptiveFiltering: true });
        }

        // Enregistrer l'image optimisée sur le disque
        await imagePipeline.toFile(filePath);

        // Récupérer les métadonnées de l'image optimisée
        const metadata = await sharp(filePath).metadata();
        console.log('Image optimisée:', {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            size: fs.statSync(filePath).size, // Taille en octets
        });

        const book = new Book({
            ...bookObject,
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get('host')}/images/${filename}`,
        });

        await book.save();
        console.log('Book saved successfully');
        res.status(201).json({ message: 'Book saved successfully!' });
    } catch (error) {
        console.error('Error saving book:', error);
        res.status(400).json({ error: error.message });
    }
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
                .then(updatedBook => res.status(200).json(updatedBook))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};

exports.getBestRatedBooks = (req, res, next) => {
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then((books) => {
            console.log('getBestRatedBooks', books);
            res.status(200).json(books);
        })
        .catch(error => res.status(400).json(error));
};

exports.getAllBook = (req, res, next) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json(error));
};

exports.getOneBook = (req, res, next) => {
    let currentUserId = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decodedToken = jwt.verify(token, process.env.SIGNATURE);
            currentUserId = decodedToken.userId;
        } catch (error) {
            console.warn('Token invalid or expired:', error.message);
        }
    }

    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (!book) {
                return res.status(404).json({ message: 'Book not found' });
            }

            const bookObj = book.toObject();
            bookObj.currentUserId = currentUserId; // Ajouter le currentUserId à la réponse
            res.status(200).json(bookObj);
        })
        .catch(error => res.status(404).json({ error }));
};

exports.modifyBook = async (req, res, next) => {
    try {
        const bookId = req.params.id;
        let bookObject = {};

        if (req.file) {
            const extension = MIME_TYPES[req.file.mimetype];
            if (!extension) {
                return res.status(400).json({ message: 'Unsupported file type' });
            }

            const filename = generateFilename(req.file.originalname, extension);
            const filePath = path.join('images', filename);

            // Initialiser le pipeline Sharp avec redimensionnement et options de compression
            let imagePipeline = sharp(req.file.buffer)
                .resize({ width: 800, withoutEnlargement: true });

            // Appliquer des options spécifiques selon le format
            if (extension === 'jpeg' || extension === 'jpg') {
                imagePipeline = imagePipeline.jpeg({ quality: 70, mozjpeg: true });
            } else if (extension === 'png') {
                imagePipeline = imagePipeline.png({ compressionLevel: 8, adaptiveFiltering: true });
            }

            // Enregistrer l'image optimisée sur le disque
            await imagePipeline.toFile(filePath);

            // Récupérer les métadonnées de l'image optimisée
            const metadata = await sharp(filePath).metadata();
            console.log('Image optimisée:', {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: fs.statSync(filePath).size, // Taille en octets
            });

            bookObject = {
                ...JSON.parse(req.body.book),
                imageUrl: `${req.protocol}://${req.get('host')}/images/${filename}`
            };
        } else {
            bookObject = { ...req.body };
        }

        delete bookObject._userId;

        const book = await Book.findOne({ _id: bookId });

        if (!book) {
            return res.status(404).json({ message: 'Book not found' });
        }

        if (book.userId !== req.auth.userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (req.file && book.imageUrl) {
            const oldFilename = book.imageUrl.split('/images/')[1];
            fs.unlink(path.join('images', oldFilename), (err) => {
                if (err) console.error('Failed to delete old image:', err);
            });
        }

        // Gestion du rating si présent
        if (req.body.rating) {
            const rating = parseInt(req.body.rating);
            const userId = req.auth.userId;

            if (rating < 0 || rating > 5) {
                return res.status(400).json({ message: 'Rating should be between 0 and 5' });
            }

            const existingRating = book.ratings.find(r => r.userId === userId);
            if (existingRating) {
                return res.status(400).json({ message: 'User has already rated this book' });
            }

            book.ratings.push({ userId: userId, grade: rating });
            const totalRatings = book.ratings.reduce((sum, r) => sum + r.grade, 0);
            book.averageRating = parseFloat((totalRatings / book.ratings.length).toFixed(2));
        }

        await Book.updateOne({ _id: bookId }, { ...bookObject, _id: bookId });
        res.status(200).json({ message: 'Book updated successfully!', book: { ...bookObject, _id: bookId } });
    } catch (error) {
        console.error('Error modifying book:', error);
        res.status(400).json({ error: error.message });
    }
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (!book) {
                return res.status(404).json({ message: 'Book not found' });
            }

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
                    if (err) {
                        console.error('Failed to delete image file:', err);
                        return res.status(500).json({ error: err });
                    }
                    deleteBookAndFile();
                });
            } else {
                deleteBookAndFile();
            }
        })
        .catch(error => res.status(500).json({ error }));
};
