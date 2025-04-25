const express       = require('express');
const router        = express.Router();
const booksCtrl     = require('../controllers/books');
const auth          = require('../middleware/auth');
const { upload, resizeImage } = require('../middleware/multer-config');

router.get('/',booksCtrl.getAllBooks);
router.post('/',auth, upload,   resizeImage, booksCtrl.createBook);
router.get('/:id',booksCtrl.getOneBook);
router.put('/:id',auth, upload, resizeImage, booksCtrl.modifyBook);
router.delete('/:id',auth,booksCtrl.deleteBook);
router.post('/:id/rating', auth,   booksCtrl.addRating);
router.put('/:id/rating', auth,    booksCtrl.updateRating);

module.exports = router;
