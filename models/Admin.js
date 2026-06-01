const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const hashed = await bcrypt.hash(password, 10);

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
});

module.exports = mongoose.model('Admin', AdminSchema);