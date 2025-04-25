const multer = require('multer');
const sharp  = require('sharp');
const path   = require('path');
const fs     = require('fs');

const MIME_TYPES = {
  'image/jpg':  'jpg',
  'image/jpeg': 'jpg',
  'image/png':  'png'
};

const storage = multer.memoryStorage();
const upload = multer({ storage }).single('image');
const resizeImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const ext    = MIME_TYPES[req.file.mimetype];
    const base   = req.file.originalname.replace(/[\s.]+/g, '_') + Date.now();
    const name   = `resized_${base}.${ext}`;
    const outDir = path.join('images', name);

    await sharp(req.file.buffer)
      .resize(500, 250)
      .toFile(outDir);

    if (req.book && req.book.imagePath) {
      const oldPath = path.join('images', req.book.imagePath);
      fs.unlink(oldPath, err => { if (err) console.error('Suppression ancienne image :', err); });
    }
    req.file.filename = name;
    req.file.path     = outDir;

    next();
  } catch (err) {
    console.error('Erreur resizeImage :', err);
    next(err);
  }
};

module.exports = { upload, resizeImage };
