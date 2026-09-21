const express = require('express');
const router = express.Router();
const axios = require('axios');
const nodemailer = require('nodemailer');
const GiftCardOrder = require('../models/GiftCardOrder');


/*
|--------------------------------------------------------------------------
| Moneris
|--------------------------------------------------------------------------
*/

function getMonerisUrl(isProd) {
    return isProd
        ? 'https://gateway.moneris.com/chktv2/request/request.php'
        : 'https://gatewayt.moneris.com/chktv2/request/request.php';
}


/*
|--------------------------------------------------------------------------
| SMTP
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| Page carte-cadeau
|--------------------------------------------------------------------------
*/

router.get('/', (req, res) => {

    res.render('service/giftcard', {
        title: 'Cartes-cadeaux'
    });

});


/*
|--------------------------------------------------------------------------
| Création de la commande + Preload Moneris
|--------------------------------------------------------------------------
*/

router.post('/checkout', async (req, res) => {

    try {

        const montant = Number(req.body.montant);
        const quantite = Number(req.body.quantite) || 1;


        /*
         * Minimum temporaire pour les tests :
         * 0,01 $
         *
         * Remettre à 10 après les tests.
         */
        if (
            !Number.isFinite(montant) ||
            montant < 0.01 ||
            !Number.isInteger(quantite) ||
            quantite < 1
        ) {

            return res.redirect(
                '/cartes-cadeaux?error=montant'
            );

        }


        const total = montant * quantite;


        /*
         * Création de la commande MongoDB
         */

        const order = await GiftCardOrder.create({

            ...req.body,

            montant,
            quantite,
            total,

            status: 'pending'

        });


        /*
         * Environnement Moneris
         */

        const isProd =
            process.env.MONERIS_ENV === 'prod';

        const monerisUrl =
            getMonerisUrl(isProd);


        /*
         * Preload
         */

        const response = await axios.post(
            monerisUrl,
            {

                store_id:
                    process.env.MONERIS_STORE_ID,

                api_token:
                    process.env.MONERIS_API_TOKEN,

                checkout_id:
                    process.env.MONERIS_GIFTCARD_CHECKOUT_ID ||
                    process.env.MONERIS_CHECKOUT_ID,

                txn_total:
                    total.toFixed(2),

                environment:
                    isProd ? 'prod' : 'qa',

                action:
                    'preload',

                language:
                    'fr',

                order_no:
                    order._id.toString()

            }
        );


        const ticket =
            response.data?.response?.ticket;


        /*
         * Aucun ticket
         */

        if (!ticket) {

            console.error(
                'Réponse Preload Moneris :',
                response.data
            );

            throw new Error(
                'Aucun ticket Moneris reçu.'
            );

        }


        /*
         * Sauvegarde du ticket
         */

        order.monerisTicket = ticket;

        await order.save();


        /*
         * Affichage du Checkout Moneris
         */

        res.render(
            'service/cartes-cadeaux-payment',
            {

                title:
                    'Paiement carte-cadeau',

                ticket,

                order,

                monerisEnv:
                    isProd ? 'prod' : 'qa',

                hideFooter:
                    true,

                hideConditionsPopup:
                    true

            }
        );


    } catch (error) {

        console.error(
            'Erreur paiement carte-cadeau:',
            error.response?.data ||
            error.message
        );


        res.redirect(
            '/cartes-cadeaux?error=payment'
        );

    }

});


/*
|--------------------------------------------------------------------------
| Confirmation du paiement
|--------------------------------------------------------------------------
*/

router.get('/confirmation', async (req, res) => {

    try {

        const { ticket } = req.query;


        /*
         * Vérification du ticket
         */

        if (!ticket) {

            return res.redirect(
                '/cartes-cadeaux?error=confirmation'
            );

        }


        /*
         * Recherche de la commande
         */

        const order =
            await GiftCardOrder.findOne({
                monerisTicket: ticket
            });


        if (!order) {

            return res.status(404).send(
                'Commande introuvable.'
            );

        }


        /*
         * Protection contre les doubles confirmations
         *
         * Si le client recharge la page après avoir payé,
         * on ne veut PAS renvoyer les courriels.
         */

        if (order.status === 'paid') {

            return res.render(
                'service/cartes-cadeaux-confirmation',
                {
                    title:
                        'Confirmation carte-cadeau',

                    order
                }
            );

        }


        /*
         * Environnement Moneris
         */

        const isProd =
            process.env.MONERIS_ENV === 'prod';

        const monerisUrl =
            getMonerisUrl(isProd);


        /*
         * Receipt Request
         *
         * Cette requête permet à notre serveur de confirmer
         * le résultat réel de la transaction.
         */

        const response = await axios.post(
            monerisUrl,
            {

                store_id:
                    process.env.MONERIS_STORE_ID,

                api_token:
                    process.env.MONERIS_API_TOKEN,

                checkout_id:
                    process.env.MONERIS_GIFTCARD_CHECKOUT_ID ||
                    process.env.MONERIS_CHECKOUT_ID,

                ticket,

                environment:
                    isProd ? 'prod' : 'qa',

                action:
                    'receipt'

            }
        );


        console.log(
            'Réponse Receipt Moneris :',
            JSON.stringify(response.data, null, 2)
        );


        /*
         * Sauvegarde de la réponse Moneris
         */

        order.paymentReceipt =
            response.data;


        /*
         * IMPORTANT
         *
         * On ne met PAS automatiquement "paid".
         *
         * Il faut vérifier la réponse de Moneris.
         */

        const monerisResponse =
            response.data?.response;


        /*
         * Pour le Hosted Checkout,
         * response_code 001 correspond au succès du callback.
         *
         * On vérifie aussi que la réponse existe.
         */

        if (
            !monerisResponse ||
            monerisResponse.response_code !== '001'
        ) {

            await order.save();

            console.error(
                'Paiement Moneris non confirmé :',
                response.data
            );

            return res.redirect(
                '/cartes-cadeaux?error=payment'
            );

        }


        /*
         * Paiement confirmé
         */

        order.status = 'paid';

        await order.save();


        /*
         * Transporteur courriel
         */

        const transporter =
            createTransporter();


        /*
         * Courriel à la station
         */

        await transporter.sendMail({

            from:
                process.env.MAIL_FROM,

            to:
                process.env.FORM_RECEIVER_GIFTCARD,

            subject:
                `Nouvelle commande de carte-cadeau - ${order.total.toFixed(2)} $`,

            html: `

                <h2>
                    Nouvelle commande de carte-cadeau
                </h2>

                <h3>
                    Acheteur
                </h3>

                <p>
                    <strong>Nom :</strong>
                    ${order.acheteurNom}
                </p>

                <p>
                    <strong>Courriel :</strong>
                    ${order.acheteurEmail}
                </p>

                <p>
                    <strong>Téléphone :</strong>
                    ${order.acheteurTelephone}
                </p>


                <h3>
                    Carte-cadeau
                </h3>

                <p>
                    <strong>Montant :</strong>
                    ${order.montant.toFixed(2)} $
                </p>

                <p>
                    <strong>Quantité :</strong>
                    ${order.quantite}
                </p>

                <p>
                    <strong>Total payé :</strong>
                    ${order.total.toFixed(2)} $
                </p>


                <h3>
                    Destinataire
                </h3>

                <p>
                    <strong>Nom :</strong>
                    ${order.destinataireNom || 'Non indiqué'}
                </p>

                <p>
                    <strong>Message :</strong>
                    ${order.message || 'Aucun message'}
                </p>


                <h3>
                    Réception
                </h3>

                <p>
                    <strong>Mode :</strong>
                    ${order.modeReception}
                </p>

                <p>
                    <strong>Adresse :</strong>
                    ${order.adresseLivraison || 'Aucune'}
                </p>


                <h3>
                    Paiement
                </h3>

                <p>
                    <strong>Statut :</strong>
                    PAYÉ
                </p>

                <p>
                    <strong>ID commande :</strong>
                    ${order._id}
                </p>

                <p>
                    <strong>Ticket Moneris :</strong>
                    ${order.monerisTicket}
                </p>

            `

        });


        /*
         * Courriel de confirmation au client
         */

        if (order.acheteurEmail) {

            await transporter.sendMail({

                from:
                    process.env.MAIL_FROM,

                to:
                    order.acheteurEmail,

                subject:
                    'Confirmation de votre achat de carte-cadeau - Vallée du Parc',

                html: `

                    <h2>
                        Merci pour votre achat !
                    </h2>

                    <p>
                        Bonjour ${order.acheteurNom},
                    </p>

                    <p>
                        Votre paiement a été confirmé avec succès.
                    </p>


                    <h3>
                        Détails de votre commande
                    </h3>

                    <p>
                        <strong>Montant de la carte :</strong>
                        ${order.montant.toFixed(2)} $
                    </p>

                    <p>
                        <strong>Quantité :</strong>
                        ${order.quantite}
                    </p>

                    <p>
                        <strong>Total payé :</strong>
                        ${order.total.toFixed(2)} $
                    </p>

                    <p>
                        <strong>Mode de réception :</strong>
                        ${order.modeReception}
                    </p>

                    ${
                        order.adresseLivraison
                            ? `
                                <p>
                                    <strong>Adresse de livraison :</strong>
                                    ${order.adresseLivraison}
                                </p>
                            `
                            : ''
                    }


                    <p>
                        Votre commande sera traitée par
                        Vallée du Parc.
                    </p>

                    <p>
                        Merci et à bientôt !
                    </p>

                `

            });

        }


        /*
         * Affichage de la confirmation
         */

        res.render(
            'service/cartes-cadeaux-confirmation',
            {

                title:
                    'Confirmation carte-cadeau',

                order

            }
        );


    } catch (error) {

        console.error(
            'Erreur confirmation carte-cadeau:',
            error.response?.data ||
            error.message
        );


        res.redirect(
            '/cartes-cadeaux?error=confirmation'
        );

    }

});


module.exports = router;