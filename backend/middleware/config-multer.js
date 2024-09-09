const multer = require('multer');

const MIME_TYPES = {
    'image/jpg':'jpg',
    'image/jpeg': 'jpeg',
    'image/png':'png',
}; //question : y'a que le mimetype pour recup l'extension ? pas d'autres moyens ?

const storage= multer.diskStorage ({
    destination: (req, file, callback) => {
        callback(null,'images');
    },
    filename: (req,file,callback) => {
        const name = file.originalname.split(' ').join('_');
        const extension = MIME_TYPES[file.mimetype];
        callback(null, name + Date.now() + '.' + extension);
    }
}); //Horodatage pr le rendre le plus spécifique possible : en gros, chaud de faire 2 meme fichier à la meme milliseconde près. Autre moyen de rendre plus unique ?

module.exports = multer({storage: storage}).single('image');
