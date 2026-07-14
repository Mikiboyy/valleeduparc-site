const mongoose = require('mongoose');

const schoolCourseSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['groupe', 'prive']
    },

    season: {
        type: String,
        required: true,
        enum: ['prevente', 'regulier']
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

    price: {
        type: Number,
        default: null
    },

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

module.exports = mongoose.model('SchoolCourse', schoolCourseSchema);