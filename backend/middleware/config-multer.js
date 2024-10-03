const multer = require('multer');
const sharp = require('sharp');

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg',
    'image/png': 'png',
};

// Utiliser memoryStorage pour stocker les fichiers en mémoire
const storage = multer.memoryStorage();

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
        fileSize: 5 * 1024 * 1024 // Limite de taille de fichier (5MB par exemple)
    }
}).single('image');

module.exports = upload;
