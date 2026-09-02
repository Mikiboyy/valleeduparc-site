const mongoose = require('mongoose');


const schoolSettingsSchema = new mongoose.Schema({

    preventeActive: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});


module.exports = mongoose.model(
    'SchoolSettings',
    schoolSettingsSchema
);