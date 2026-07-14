const express = require('express');
const router = express.Router();
const axios = require('axios');
const nodemailer = require('nodemailer');
const GiftCardOrder = require('../models/GiftCardOrder');

function getMonerisUrl(isProd) {
    return isProd
        ? 'https://gateway.moneris.com/chkt/request/request.php'
        : 'https://gatewayt.moneris.com/chkt/request/request.php';
}

function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

router.get('/', (req, res) => {
    res.render('service/giftcard', {
        title: 'Cartes-cadeaux'
    });
});

router.post('/checkout', async (req, res) => {
    try {
        const montant = Number(req.body.montant);
        const quantite = Number(req.body.quantite) || 1;

        if (!montant || montant < 10 || quantite < 1) {
            return res.redirect('/cartes-cadeaux?error=montant');
        }

        const total = montant * quantite;

        const order = await GiftCardOrder.create({
            ...req.body,
            montant,
            quantite,
            total,
            status: 'pending'
        });

        const isProd = process.env.MONERIS_ENV === 'prod';
        const monerisUrl = getMonerisUrl(isProd);

        const response = await axios.post(monerisUrl, {
            store_id: process.env.MONERIS_STORE_ID,
            api_token: process.env.MONERIS_API_TOKEN,
            checkout_id: process.env.MONERIS_GIFTCARD_CHECKOUT_ID || process.env.MONERIS_CHECKOUT_ID,
            txn_total: total.toFixed(2),
            environment: isProd ? 'prod' : 'qa',
            action: 'preload',
            language: 'fr',
            order_no: order._id.toString()
        });

        const ticket = response.data?.response?.ticket;

        if (!ticket) {
            console.log(response.data);
            throw new Error('Aucun ticket Moneris reçu.');
        }

        order.monerisTicket = ticket;
        await order.save();

        res.render('service/cartes-cadeaux-payment', {
            title: 'Paiement carte-cadeau',
            ticket,
            order,
            monerisEnv: isProd ? 'prod' : 'qa',
            hideFooter: true,
            hideConditionsPopup: true
        });

    } catch (error) {
        console.error('Erreur paiement carte-cadeau:', error.response?.data || error.message);
        res.redirect('/cartes-cadeaux?error=payment');
    }
});

router.get('/confirmation', async (req, res) => {
    try {
        const { ticket } = req.query;

        const order = await GiftCardOrder.findOne({ monerisTicket: ticket });

        if (!order) {
            return res.status(404).send('Commande introuvable.');
        }

        const isProd = process.env.MONERIS_ENV === 'prod';
        const monerisUrl = getMonerisUrl(isProd);

        const response = await axios.post(monerisUrl, {
            store_id: process.env.MONERIS_STORE_ID,
            api_token: process.env.MONERIS_API_TOKEN,
            checkout_id: process.env.MONERIS_GIFTCARD_CHECKOUT_ID || process.env.MONERIS_CHECKOUT_ID,
            ticket,
            environment: isProd ? 'prod' : 'qa',
            action: 'receipt'
        });

        order.paymentReceipt = response.data;
        order.status = 'paid';
        await order.save();

        const transporter = createTransporter();

        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to: process.env.FORM_RECEIVER_GIFTCARD,
            subject: `Nouvelle commande de carte-cadeau - ${order.total.toFixed(2)} $`,
            html: `
                <h2>Nouvelle commande de carte-cadeau</h2>

                <h3>Acheteur</h3>
                <p><strong>Nom :</strong> ${order.acheteurNom}</p>
                <p><strong>Courriel :</strong> ${order.acheteurEmail}</p>
                <p><strong>Téléphone :</strong> ${order.acheteurTelephone}</p>

                <h3>Carte-cadeau</h3>
                <p><strong>Montant :</strong> ${order.montant.toFixed(2)} $</p>
                <p><strong>Quantité :</strong> ${order.quantite}</p>
                <p><strong>Total payé :</strong> ${order.total.toFixed(2)} $</p>

                <h3>Destinataire</h3>
                <p><strong>Nom :</strong> ${order.destinataireNom || 'Non indiqué'}</p>
                <p><strong>Message :</strong> ${order.message || 'Aucun message'}</p>

                <h3>Réception</h3>
                <p><strong>Mode :</strong> ${order.modeReception}</p>
                <p><strong>Adresse :</strong> ${order.adresseLivraison || 'Aucune'}</p>

                <p><strong>ID commande :</strong> ${order._id}</p>
            `
        });

        res.render('service/cartes-cadeaux-confirmation', {
            title: 'Confirmation carte-cadeau',
            order
        });

    } catch (error) {
        console.error('Erreur confirmation carte-cadeau:', error.response?.data || error.message);
        res.redirect('/cartes-cadeaux?error=confirmation');
    }
});

module.exports = router;