const mongoose = require('mongoose');

const ConditionSchema = new mongoose.Schema({
    temperature: Number,
    neige: Number,
    pistes: String,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Condition', ConditionSchema);