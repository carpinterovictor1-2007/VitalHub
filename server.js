require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const axios   = require('axios');
const morgan  = require('morgan');
const helmet  = require('helmet');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc:  ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://www.gstatic.com"],
            connectSrc: ["'self'", "https://*.googleapis.com", "https://*.google.com", "https://*.firebaseio.com", "wss://*.firebaseio.com"],
            imgSrc:     ["'self'", "data:", "https://*"],
            frameSrc:   ["https://accounts.google.com", "https://salud-preventiva-a7da3.firebaseapp.com"],
        },
    },
}));

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static('.'));  // Serve index.html at localhost:3000

// ─── Gemini AI Proxy ──────────────────────────────────────
// Auth & Database are now handled by Firebase (no server needed)
// This server only hides your Gemini API Key from the browser.
app.post('/api/recipe', async (req, res) => {
    const { ingredients } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        return res.status(500).json({ error: 'Configura tu GEMINI_API_KEY en el archivo .env' });
    }

    const prompt = `Eres un nutricionista profesional. Crea una receta saludable, práctica y deliciosa usando estos ingredientes: ${ingredients}. Incluye: nombre del plato, tiempo de preparación, lista de ingredientes con cantidades, pasos numerados, y beneficios nutricionales. Responde en español, de forma clara y amigable.`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            { contents: [{ role: 'user', parts: [{ text: prompt }] }] }
        );
        res.json({ recipe: response.data.candidates[0].content.parts[0].text });
    } catch (e) {
        console.error(e.response?.data || e.message);
        res.status(500).json({ error: 'Error con el servicio de IA de Gemini' });
    }
});

app.listen(PORT, () => {
    console.log(`\n================================================`);
    console.log(`🚀 VITALHUB SUPREME: http://localhost:${PORT}`);
    console.log(`🔥 Auth & DB: Firebase (sin configuración local)`);
    console.log(`🤖 Gemini AI Proxy: ACTIVO`);
    console.log(`================================================\n`);
});
