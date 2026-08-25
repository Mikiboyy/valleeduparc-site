require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const path = require('path');

const adminRoutes = require('./routes/admin');
const pagesRoutes = require('./routes/pages');
const mailchimpRoutes = require('./routes/mailchimp');
const getSnowConditions = require('./services/stationService');
const inscriptionRoutes = require('./routes/inscription');
const carrieresRoutes = require('./routes/carrieres');
const locationRoutes = require('./routes/location');
const giftCardRoutes = require('./routes/giftCards');
const contactRoutes = require('./routes/contact');

const app = express();

/* =========================
   MONGODB
========================= */

if (!process.env.MONGODB_URI) {

    console.error("ERREUR : MONGODB_URI n'est pas définie.");

} else {

    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('MongoDB Atlas connecté'))
        .catch(err => console.error('Erreur MongoDB:', err));

}


/* =========================
   VIEW ENGINE
========================= */

app.set('view engine', 'ejs');
app.set('layout', 'layout');

app.use(expressLayouts);


/* =========================
   STATIC FILES
========================= */

/* Tous les fichiers dans /public */
app.use(express.static(path.join(__dirname, 'public')));


/* =========================
   BODY PARSER
========================= */

app.use(express.urlencoded({
    extended: true
}));

app.use(express.json());


/* =========================
   SESSION
========================= */

app.set('trust proxy', 1);

app.use(session({

    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {

        httpOnly: true,

        secure: process.env.NODE_ENV === 'production',

        sameSite: 'lax',

        maxAge: 1000 * 60 * 60 * 4

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
   SNOW CONDITIONS
========================= */

app.use(async (req, res, next) => {

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

        res.locals.conditions =
            await getSnowConditions();

    } catch (error) {

        console.log(
            "Erreur neige:",
            error.message
        );

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

app.use('/contact', contactRoutes);

app.use('/', pagesRoutes);

app.use('/salle_form', salleFormRoutes);


/* =========================
   404
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

    console.log(
        `Serveur lancé sur http://localhost:${PORT}`
    );

});