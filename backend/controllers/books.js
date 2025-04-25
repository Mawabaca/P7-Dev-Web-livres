const Book = require('../models/Book');
const fs = require('fs');



exports.createBook = (req, res, next) => {
    try {
      const bookObject = JSON.parse(req.body.book);
      bookObject.year = Number(bookObject.year);
      delete bookObject._id;
      delete bookObject._userId;
  
      const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        ratings: [],
        averageRating: 0
      });
  
      book.save()
        .then(() => res.status(201).json({ message: 'Livre enregistré !' }))
        .catch(error => {
          res.status(400).json({ error });
        });
  
    } catch (err) {
      res.status(500).json({ error: 'Format de données invalide ou image manquante' });
    }
  };




  exports.getAllBooks = (req, res, next) => {
    Book.find()
      .then(books => res.status(200).json(books))
      .catch(error => res.status(400).json({ error }));
  };
  
  exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
      .then(book => res.status(200).json(book))
      .catch(error => res.status(404).json({ error }));
  };





  exports.modifyBook = (req, res, next) => {
    const bookObject = req.file
      ? {
          ...JSON.parse(req.body.book),
          imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        }
      : { ...req.body }
    delete bookObject._userId
  
    Book.findOne({ _id: req.params.id })
      .then(book => {
        if (book.userId !== req.auth.userId) {
          return res.status(401).json({ message: 'Non autorisé' })
        }
  
        if (req.file && book.imageUrl) {
          const oldFilename = book.imageUrl.split('/images/')[1]
          fs.unlink(path.join('images', oldFilename), () => {
            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
              .then(() => res.status(200).json({ message: 'Livre modifié !' }))
              .catch(error => res.status(400).json({ error }))
          })
        } else {
          Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Livre modifié !' }))
            .catch(error => res.status(400).json({ error }))
        }
      })
      .catch(error => res.status(400).json({ error }))
  }



exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => {
      if (book.userId !== req.auth.userId) {
        return res.status(401).json({ message: 'Non autorisé' });
      }

      const filename = book.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Book.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Livre supprimé !' }))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};




exports.addRating = (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const grade = req.body.rating ?? null;
  
    if (grade === null || isNaN(grade) || grade < 0 || grade > 5) {
      return res.status(400).json({ error: 'Note invalide (0-5).' });
    }
    Book.findOne({ _id: req.params.id })
      .then(book => {
        if (!book) {
          return res.status(404).json({ error: 'Livre introuvable.' });
        }
        if (book.ratings.some(r => r.userId === userId)) {
          return res.status(409).json({ error: 'Vous avez déjà noté ce livre.' });
        }

        book.ratings.push({ userId, grade });
        const sum = book.ratings.reduce((acc, r) => acc + r.grade, 0);
        book.averageRating = Math.round((sum / book.ratings.length) * 10) / 10;

        return book.save()
          .then(updatedBook => res.status(200).json({ message: 'Note ajoutée.', book: updatedBook }));
      })
      .catch(error => res.status(500).json({ error: 'Erreur interne.' }));
  } catch (err) {
    res.status(500).json({ error: 'Format de données invalide.' });
  }
};


exports.bestRating = (req, res, next) => {

  Book.find().sort({ averageRating: -1 }).limit(3)
    .then(books => {
      console.log(books);
      books ? res.status(200).json( books ): res.status(404).json({ error: 'Aucun livre trouvé.' });
    })
    .catch(error => res.status(500).json({ error: 'Erreur interne.' }));
}