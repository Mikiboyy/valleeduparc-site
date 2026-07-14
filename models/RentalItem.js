const mongoose = require('mongoose');

const rentalItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    subCategory: {
        type: String,
        default: ''
    },

    ageGroup: {
        type: String,
        default: ''
    },

    period: {
        type: String,
        default: ''
    },

    price: {
        type: Number,
        required: true
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

module.exports = mongoose.model('RentalItem', rentalItemSchema);