// config-multer.js
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Définir les types MIME acceptés
const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg',
    'image/png': 'png',
};

// Configurer le stockage en mémoire
const storage = multer.memoryStorage();

// Middleware multer avec filtrage des fichiers et limite de taille
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (MIME_TYPES[file.mimetype]) {
            cb(null, true);
        } else {
            cb(new Error('Invalid mime type'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de taille de fichier (5MB)
    }
}).single('image');

// Middleware pour optimiser l'image avec Sharp
const optimizeImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        const extension = MIME_TYPES[req.file.mimetype];
        if (!extension) {
            return res.status(400).json({ message: 'Type de fichier non supporté' });
        }

        // Fonction pour générer un nom de fichier unique
        const generateFilename = (originalName, extension) => {
            const name = originalName.split(' ').join('_').split('.')[0];
            return `${name}_${Date.now()}.${extension}`;
        };

        const filename = generateFilename(req.file.originalname, extension);
        const filepath = path.join(__dirname, '..', 'images', filename);

        // Optimiser l'image avec Sharp et l'enregistrer sur le disque
        await sharp(req.file.buffer)
            .resize(800, 800, {
                fit: sharp.fit.inside,
                withoutEnlargement: true,
            })
            .toFormat('jpeg', { quality: 80 }) // Convertir en JPEG avec qualité 80%
            .toFile(filepath);

        // Attacher le nom de fichier et le chemin à l'objet req pour utilisation dans le contrôleur
        req.optimizedImage = {
            filename: filename,
            path: filepath
        };

        next();
    } catch (error) {
        console.error('Erreur lors de l\'optimisation de l\'image:', error);
        res.status(500).json({ error: 'Erreur lors de l\'optimisation de l\'image' });
    }
};

module.exports = [upload, optimizeImage];
