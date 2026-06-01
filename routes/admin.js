const express = require('express');
const router = express.Router();
const multer = require('multer');
const Event = require('../models/Event');
const auth = require('../middleware/auth');

/* =========================
   MULTER CONFIG (sécurisé)
========================= */
const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Fichier invalide'), false);
        }
        cb(null, true);
    }
});

/* =========================
   DASHBOARD
========================= */
router.get('/', auth, (req, res) => {
    res.render('admin/dashboard');
});

/* =========================
   PAGE ÉVÉNEMENTS ADMIN
========================= */
router.get('/events', auth, async (req, res) => {
    try {
        const upcoming = await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 });
        const past = await Event.find({ date: { $lt: new Date() } }).sort({ date: -1 });

        res.render('admin-events', {
            upcoming,
            past
        });

    } catch (error) {
        console.log(error);
        res.render('admin-events', {
            upcoming: [],
            past: []
        });
    }
});

/* =========================
   CRÉER ÉVÉNEMENT
========================= */
router.post('/events', auth, upload.single('image'), async (req, res) => {
    try {
        await Event.create({
            title: req.body.title,
            description: req.body.description,
            date: req.body.date,
            image: req.file ? req.file.filename : null,
            location: req.body.location
        });

        res.redirect('/admin/events');

    } catch (error) {
        console.log(error);
        res.redirect('/admin/events');
    }
});

module.exports = router;