const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: ''
    },

    /*
        Ancienne date principale.

        On la conserve pour assurer la compatibilité
        avec les événements déjà existants.
    */
    date: {
        type: Date,
        required: true,
        index: true
    },

    /*
        Plusieurs dates précises.

        Exemple :

        5 décembre
        6 décembre
        12 décembre
        13 décembre
    */
    dates: [
        {
            type: Date
        }
    ],

    /*
        Début d'un événement qui dure plusieurs jours.
    */
    startDate: {
        type: Date,
        default: null
    },

    /*
        Fin d'un événement qui dure plusieurs jours.
    */
    endDate: {
        type: Date,
        default: null
    },

    image: {
        type: String,
        default: ''
    },

    location: {
        type: String,
        default: ''
    }

}, {
    timestamps: true
});


module.exports = mongoose.model('Event', eventSchema);