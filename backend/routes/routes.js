const express = require ('express');
const router = express.Router();
const bookCtrl= require ('../controleur/control.js');
const auth = require ('../middleware/auth.js');
const multer = require ('../middleware/config-multer.js');


router.get('/', bookCtrl.getAllBook);
router.get('/bestrating', bookCtrl.getBestRatedBooks);
router.post('/', auth, multer, bookCtrl.createBook);
router.post('/:id/rating', auth, bookCtrl.rateBook);
router.get('/:id', bookCtrl.getOneBook);
router.put('/:id', auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);





module.exports = router;