const mongoose = require('mongoose');

const giftCardOrderSchema = new mongoose.Schema({
    acheteurNom: String,
    acheteurEmail: String,
    acheteurTelephone: String,

    destinataireNom: String,
    message: String,

    montant: Number,
    quantite: Number,
    total: Number,

    modeReception: String,
    adresseLivraison: String,

    monerisTicket: String,
    status: {
        type: String,
        default: 'pending'
    },
    paymentReceipt: Object
}, {
    timestamps: true
});

module.exports = mongoose.model('GiftCardOrder', giftCardOrderSchema);