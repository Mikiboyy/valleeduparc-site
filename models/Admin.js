const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        required: true,
        enum: ['admin', 'evenement', 'prix', 'patrouille', 'carriere']
    },

    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

adminSchema.pre('save', async function() {
    if (!this.isModified('password')) return;

    this.password = await bcrypt.hash(this.password, 10);
});

adminSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.models.Admin || mongoose.model('Admin', adminSchema);