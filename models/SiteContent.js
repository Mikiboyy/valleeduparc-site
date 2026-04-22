const mongoose = require('mongoose');

const SiteContentSchema = new mongoose.Schema({
    key: String, // ex: "popup", "prices", "homepage"
    data: Object // contenu flexible
});

module.exports = mongoose.model('SiteContent', SiteContentSchema);