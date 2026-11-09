
const rateLimit = require('express-rate-limit');

/*
=========================================================
CONFIGURATION COMMUNE DES FORMULAIRES
=========================================================
*/

const createFormLimiter = ({
    limit = 5,
    message = 'Trop de soumissions. Veuillez réessayer plus tard.'
} = {}) => {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        limit,

        // Ne limite que les soumissions POST
        skip: (req) => req.method !== 'POST',

        standardHeaders: 'draft-8',
        legacyHeaders: false,

        message: {
            success: false,
            error: message
        }
    });
};

/*
=========================================================
LIMITER ADMIN
=========================================================
*/

const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,

    standardHeaders: 'draft-8',
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
    limit: 10,

    standardHeaders: 'draft-8',
    legacyHeaders: false,

    message: {
        error: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.'
    }
});

/*
=========================================================
LIMITER FORMULAIRES PUBLICS GÉNÉRIQUE
=========================================================
*/

const publicFormLimiter = createFormLimiter({
    limit: 10,
    message: 'Trop de soumissions. Veuillez réessayer dans 15 minutes.'
});

/*
=========================================================
LIMITER CRÉDIT MALADIE
=========================================================
*/

const creditMaladieLimiter = createFormLimiter({
    limit: 5,
    message: 'Trop de demandes de crédit maladie. Veuillez réessayer plus tard.'
});

/*
=========================================================
LIMITER CANDIDATURES
=========================================================
*/

const carrieresLimiter = createFormLimiter({
    limit: 5,
    message: 'Trop de candidatures envoyées. Veuillez réessayer plus tard.'
});

/*
=========================================================
LIMITER DEMANDES CORPORATIVES
=========================================================
*/

const corpoLimiter = createFormLimiter({
    limit: 5,
    message: 'Trop de demandes corporatives. Veuillez réessayer plus tard.'
});

/*
=========================================================
LIMITER DEMANDES DE SALLE
=========================================================
*/

const salleLimiter = createFormLimiter({
    limit: 5,
    message: 'Trop de demandes de réservation de salle. Veuillez réessayer plus tard.'
});

/*
=========================================================
LIMITER INSCRIPTIONS
=========================================================
*/

const inscriptionLimiter = createFormLimiter({
    limit: 5,
    message: 'Trop de tentatives d’inscription. Veuillez réessayer plus tard.'
});

/*
=========================================================
EXPORTATIONS
=========================================================
*/

module.exports = {
    adminLimiter,
    loginLimiter,
    publicFormLimiter,
    creditMaladieLimiter,
    carrieresLimiter,
    corpoLimiter,
    salleLimiter,
    inscriptionLimiter,
    createFormLimiter
};
