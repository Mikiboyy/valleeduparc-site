const mongoose = require('mongoose');

const schoolCourseSchema = new mongoose.Schema({

    type: {
        type: String,
        required: true,
        enum: ['groupe', 'prive']
    },

    title: {
        type: String,
        required: true
    },

    duration: {
        type: String,
        default: ''
    },

    category: {
        type: String,
        default: ''
    },

    /*
    =========================
    PRIX RÉGULIER
    =========================
    */

    regularPrice: {
        type: Number,
        default: null
    },


    /*
    =========================
    PRIX PRÉVENTE
    =========================
    */

    presalePrice: {
        type: Number,
        default: null
    },


    /*
    =========================
    TEXTE SPÉCIAL
    =========================
    */

    priceLabel: {
        type: String,
        default: ''
    },

    summary: {
        type: String,
        default: ''
    },

    details: {
        type: String,
        default: ''
    },

    order: {
        type: Number,
        default: 0
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

module.exports =
    mongoose.model(
        'SchoolCourse',
        schoolCourseSchema
    );