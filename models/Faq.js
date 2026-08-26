const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            enum: [
                'abonnements',
                'montagne',
                'pistes',
                'horaire'
            ]
        },

        question: {
            type: String,
            required: true,
            trim: true
        },

        answer: {
            type: String,
            required: true,
            trim: true
        },

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
        timestamps: true,

        collection: 'faq'
    }
);

module.exports = mongoose.model('Faq', faqSchema);