const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
    page: String,
    hero: {
        title: String,
        subtitle: String,
        image: String
    }
});

module.exports = mongoose.model('Page', PageSchema);