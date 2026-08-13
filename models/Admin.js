const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema(
    {
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
            enum: [
                'admin',
                'evenement',
                'prix',
                'patrouille',
                'carriere'
            ],
            required: true
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

adminSchema.pre('save', async function () {

    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(12);

    this.password = await bcrypt.hash(this.password, salt);
});


adminSchema.methods.comparePassword = async function (password) {

    return bcrypt.compare(password, this.password);

};

module.exports =
    mongoose.models.Admin ||
    mongoose.model('Admin', adminSchema);