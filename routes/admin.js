const express = require('express');
const router = express.Router();
const multer = require('multer');


// 1. Configuration du stockage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },

    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});


// 2. Initialiser multer APRÈS storage
const upload = multer({
    storage: storage
});


// Dashboard admin
router.get('/', (req, res) => {
    res.render('admin/dashboard');
});


// Upload image
router.post('/upload', upload.single('image'), (req, res) => {
    res.send({
        message: "Image uploadée avec succès",
        path: '/uploads/' + req.file.filename
    });
});


module.exports = router;