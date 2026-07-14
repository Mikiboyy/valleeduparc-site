const mongoose = require('mongoose');

const dailyTicketPriceSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    ticketType: {
        type: String,
        required: true
    },
    ageGroup: {
        type: String,
        required: true
    },
    onlinePrice: {
        type: Number,
        default: null
    },
    counterPrice: {
        type: Number,
        default: null
    },
    isFree: {
        type: Boolean,
        default: false
    },
    categoryOrder: {
        type: Number,
        default: 0
    },
    ticketOrder: {
        type: Number,
        default: 0
    },
    ageOrder: {
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

module.exports = mongoose.model('DailyTicketPrice', dailyTicketPriceSchema);