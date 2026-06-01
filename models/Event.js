const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    date: { type: Date, required: true, index: true },
    image: String,
    location: String
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);