const mongoose = require('mongoose');

const subscriptionPriceSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    ageGroup: {
        type: String,
        required: true
    },
    regularPrice: {
        type: Number,
        default: null
    },
    fdcPrice: {
        type: Number,
        default: null
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

module.exports = mongoose.model('SubscriptionPrice', subscriptionPriceSchema);