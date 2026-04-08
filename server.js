require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const morgan = require('morgan');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'VitalHub_Secret_2026';

// --- Database Initialization (SQLite Zero-Install) ---
const db = new Database('vitalhub.db');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    water REAL DEFAULT 0,
    mood INTEGER DEFAULT 3,
    weight REAL,
    height REAL,
    date TEXT DEFAULT (date('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    taken INTEGER DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// --- Middleware ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            "img-src": ["'self'", "data:", "https://*"],
        },
    },
}));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- Authentication Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token de acceso faltante' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
        req.user = user;
        next();
    });
};

// --- Auth Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, age, gender } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const insertUser = db.prepare('INSERT INTO users (name, email, password, age, gender) VALUES (?, ?, ?, ?, ?)');
        const result = insertUser.run(name, email, hashedPassword, age, gender);
        
        res.status(201).json({ message: 'Usuario registrado con éxito', userId: result.lastInsertRowid });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Credenciales inválidas' });

        const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, age: user.age } });
    } catch (error) {
        res.status(500).json({ error: 'Error en el inicio de sesión' });
    }
});

// --- Health Data Routes (Protected) ---

app.get('/api/me/metrics', authenticateToken, (req, res) => {
    const metrics = db.prepare('SELECT * FROM metrics WHERE user_id = ? ORDER BY date DESC LIMIT 1').get(req.user.id);
    res.json(metrics || { water: 0, mood: 3 });
});

app.post('/api/me/metrics', authenticateToken, (req, res) => {
    const { water, mood, weight, height } = req.body;
    const date = new Date().toISOString().split('T')[0];
    
    const upsert = db.prepare(`
        INSERT INTO metrics (user_id, water, mood, weight, height, date)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, date) DO UPDATE SET
        water=excluded.water, mood=excluded.mood, weight=excluded.weight, height=excluded.height
    `);
    // Note: To use ON CONFLICT, we need a UNIQUE(user_id, date) constraint. Let's add it.
    try {
        // Migration check
        db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_user_date ON metrics(user_id, date)');
        upsert.run(req.user.id, water, mood, weight, height, date);
        res.json({ message: 'Métricas actualizadas' });
    } catch (e) {
        res.status(500).json({ error: 'Error al actualizar métricas' });
    }
});

// AI Recipe Proxy (Open for Guests/Registered)
app.post('/api/recipe', async (req, res) => {
    const { ingredients } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'API Key de Gemini no configurada' });

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            { contents: [{ role: 'user', parts: [{ text: `Nutricionista AI: Crea una receta saludable con: ${ingredients}` }] }] }
        );
        res.json({ recipe: response.data.candidates[0].content.parts[0].text });
    } catch (error) {
        res.status(500).json({ error: 'Error con servicio de IA' });
    }
});

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`\n==============================================`);
    console.log(`🚀 VITALHUB SUPREME ENGINE: ONLINE`);
    console.log(`📁 BASE DE DATOS: SQLite (vitalhub.db)`);
    console.log(`🛡️  SEGURIDAD: JWT + Bcrypt + CSP`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`==============================================\n`);
});
