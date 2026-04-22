const express = require('express');
const router = express.Router();
const axios = require('axios');

// simple cache mémoire
let cache = {};

router.post('/', async (req, res) => {
    const { text, lang } = req.body;

    const key = text + lang;

    if (cache[key]) {
        return res.json({ translated: cache[key] });
    }

    try {
        const response = await axios.post(
            'https://api-free.deepl.com/v2/translate',
            new URLSearchParams({
                auth_key: 'TA_CLE_DEEPL_ICI',
                text: text,
                target_lang: lang.toUpperCase()
            })
        );

        const translated = response.data.translations[0].text;

        cache[key] = translated;

        res.json({ translated });

    } catch (err) {
        res.json({ translated: text }); // fallback
    }
});

module.exports = router;