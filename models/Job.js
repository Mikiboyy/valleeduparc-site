const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },

    department: {
        type: String,
        required: true
    },

    summary: {
        type: String,
        required: true
    },

    details: {
        type: [String],
        default: []
    },

    image: {
        type: String,
        default: 'default-job.jpg'
    },

    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);