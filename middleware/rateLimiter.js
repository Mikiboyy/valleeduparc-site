const rateLimit = require('express-rate-limit');


/*
=========================================================
LIMITER ADMIN
=========================================================
*/

const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    max: 100,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        error: 'Trop de requêtes. Veuillez réessayer plus tard.'
    }
});


/*
=========================================================
LIMITER LOGIN
=========================================================
*/

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,

    max: 10,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        error: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.'
    }
});


module.exports = {
    adminLimiter,
    loginLimiter
};