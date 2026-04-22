require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const adminRoutes = require('./routes/admin');
const getSnowConditions = require('./services/stationService');
const mailchimpRoutes = require('./routes/mailchimp');

const app = express();

app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/admin', adminRoutes);
app.use('/', mailchimpRoutes);

mongoose.connect('mongodb://127.0.0.1/valleeduparc');

const pagesRoutes = require('./routes/pages');
app.use('/', pagesRoutes);

app.listen(3000, () => {
    console.log('Serveur lancé sur http://localhost:3000');
});

app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret123',
    resave: false,
    saveUninitialized: true
}));

app.use(async (req, res, next) => {
    res.locals.conditions = await getSnowConditions();
    next();
});
