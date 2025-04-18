const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },

  filename: (req, file, callback) => {
    const name = file.originalname.replace(/[\s.]+/g, '_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  }
});

module.exports = multer({storage: storage}).single('image');

module.exports.resizeImage = (req, res, next) => {
  if (!req.file) {
    return next();
  }
  const originalPath = req.file.path; 
  const originalName = req.file.filename; 
  const resizedPath = path.join('images', `resized_${originalName}`); 
  sharp(originalPath)
    .resize(500, 250) 
    .toFile(resizedPath)
    .then(() => {
      fs.unlink(originalPath, (err) => {
        if (err) {
          console.error('Erreur lors de la suppression de l\'image originale :', err);
        }
     
        req.file.path = resizedPath;
        next();
      });
    })
    .catch((error) => {
      console.error('Erreur lors du redimensionnement de l\'image :', error);
      next(); 
    });
};