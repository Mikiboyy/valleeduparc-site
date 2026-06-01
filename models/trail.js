const mongoose = require('mongoose');

const trailSchema = new mongoose.Schema({
    trailNumber: {
        type: Number,
        required: true,
        unique: true
    },

    name: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    openDay: {
        type: Boolean,
        default: false
    },

    openNight: {
        type: Boolean,
        default: false
    },

    difficulty: {
        type: String,
        default: ''
    }

}, { timestamps: true });

module.exports = mongoose.model('Trail', trailSchema);