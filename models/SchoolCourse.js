const mongoose = require('mongoose');

const schoolCourseSchema = new mongoose.Schema({

    type: {
        type: String,
        required: true,
        enum: ['groupe', 'prive']
    },

    season: {
        type: String,
        default: 'regulier'
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

    summary: {
        type: String,
        default: ''
    },

    description: {
        type: String,
        default: ''
    },

    details: {
        type: String,
        default: ''
    },

    lessonDuration: {
        type: String,
        default: ''
    },

    schedule: {
        type: String,
        default: ''
    },

    notes: {
        type: [String],
        default: []
    },


    // =========================
    // PRIX
    // =========================

    price: {

        regularPrice: {
            type: Number,
            default: null
        },

        presalePrice: {
            type: Number,
            default: null
        }

    },


    // =========================
    // TEXTE DES PRIX
    // =========================

    priceLabel: {
        type: String,
        default: ''
    },

    presalePriceLabel: {
        type: String,
        default: ''
    },


    // =========================
    // ORDRE
    // =========================

    order: {
        type: Number,
        default: 0
    },


    // =========================
    // ACTIVATION
    // =========================

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    'SchoolCourse',
    schoolCourseSchema
);