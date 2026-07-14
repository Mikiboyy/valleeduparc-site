require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');

const adminRoutes = require('./routes/admin');
const pagesRoutes = require('./routes/pages');
const mailchimpRoutes = require('./routes/mailchimp');
const getSnowConditions = require('./services/stationService');
const inscriptionRoutes = require('./routes/inscription');
const carrieresRoutes = require('./routes/carrieres');
const locationRoutes = require('./routes/location');
const giftCardRoutes = require('./routes/giftCards');

const app = express();

/* =========================
   MONGODB
========================= */
mongoose.connect('mongodb://127.0.0.1/valleeduparc')
    .then(() => console.log('MongoDB connecté'))
    .catch(err => console.log(err));

/* =========================
   VIEW ENGINE
========================= */
app.set('view engine', 'ejs');
app.set('layout', 'layout');
app.use(expressLayouts);

/* =========================
   STATIC + BODY PARSER
========================= */
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* =========================
   SESSION (SÉCURISÉ)
========================= */
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false // mettre true en production avec HTTPS
    }
}));


/* =========================
   GLOBAL VARIABLES
========================= */
app.use((req, res, next) => {
    res.locals.title = "Vallée du Parc";
    res.locals.success = req.query.success;
    res.locals.exists = req.query.exists;
    res.locals.error = req.query.error;
    res.locals.adminUser = req.session.admin || null;
    next();
});

/* =========================
   SNOW CONDITIONS (OPTIMISÉ)
========================= */
app.use(async (req, res, next) => {

    // éviter appels inutiles
    if (
        req.path.startsWith('/admin') ||
        req.path.startsWith('/css') ||
        req.path.startsWith('/image') ||
        req.path.startsWith('/uploads') ||
        req.path.startsWith('/icons')
    ) {
        return next();
    }

    try {
        res.locals.conditions = await getSnowConditions();
    } catch (error) {
        console.log("Erreur neige:", error.message);
        res.locals.conditions = null;
    }

    next();
});

/* =========================
   ROUTES
========================= */
app.use('/admin-vdp', adminRoutes);
app.use('/', mailchimpRoutes);
app.use('/inscription', inscriptionRoutes);
app.use('/location-form', locationRoutes);
app.use('/carrieres-form', carrieresRoutes);
app.use('/cartes-cadeaux', giftCardRoutes);
app.use('/', pagesRoutes);

/* =========================
   404 (BONNE PRATIQUE)
========================= */
app.use((req, res) => {
    res.status(404).render('404', {
        title: "Page non trouvée"
    });
});

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Serveur lancé sur http://localhost:${PORT}`);
});