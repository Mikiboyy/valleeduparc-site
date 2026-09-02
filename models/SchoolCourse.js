const mongoose = require('mongoose');

const schoolCourseSchema = new mongoose.Schema(
    {

        // =========================
        // TYPE
        // =========================

        type: {
            type: String,
            required: true,
            enum: ['groupe', 'prive']
        },


        // =========================
        // SAISON
        // =========================

        season: {
            type: String,
            default: 'regulier'
        },


        // =========================
        // INFORMATIONS PRINCIPALES
        // =========================

        title: {
            type: String,
            required: true
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


        // =========================
        // DURÉE / HORAIRE
        // =========================

        duration: {
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


        // =========================
        // NOTES
        // =========================

        notes: {
            type: [String],
            default: []
        },


        // =========================
        // PRIX
        // =========================

        prices: {

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
        // TEXTES DES PRIX
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
        // ADMINISTRATION
        // =========================

        order: {
            type: Number,
            default: 0
        },

        isActive: {
            type: Boolean,
            default: true
        }

    },

    {
        timestamps: true
    }
);


module.exports = mongoose.model(
    'SchoolCourse',
    schoolCourseSchema
);