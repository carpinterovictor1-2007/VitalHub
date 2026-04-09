/**
 * VitalHub Supreme v4.0 - Unified Engine
 * =====================================
 * Motor central que gestiona la lógica de negocio y conectividad.
 */

// ─── STATE ──────────────────────────────────────────────────
const State = {
    user: null,
    isGuest: localStorage.getItem('vh4_guest') === 'true',
    data: {
        name: 'Explorador',
        water: 0, mood: 0, weight: 0, height: 0,
        age: 30, meds: []
    },
    firebase: { auth: null, db: null, storage: null }
};

// ─── INIT ───────────────────────────────────────────────────
async function initApp() {
    console.log('⚡ Engine: Inicializando componentes...');
    
    // 1. Cargar Tema
    const theme = localStorage.getItem('vh4_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeUI(theme);

    // 2. Conectar Firebase (si hay claves)
    await connectServices();

    // 3. Flujo de Acceso
    if (State.isGuest) {
        loadGuestData();
        unlockApp();
    } else {
        State.firebase.auth?.onAuthStateChanged(async (user) => {
            if (user) {
                State.user = user;
                await syncFromFirestore();
                unlockApp();
            } else {
                showAuthOverlay(true);
            }
        });
    }
}

async function connectServices() {
    try {
        if (typeof firebase !== 'undefined' && window.VITALHUB_CONFIG?.firebase?.apiKey) {
            if (!firebase.apps.length) firebase.initializeApp(window.VITALHUB_CONFIG.firebase);
            State.firebase.auth = firebase.auth();
            State.firebase.db = firebase.firestore();
            console.log('✅ Firebase: Conectado.');
        }
    } catch (e) { console.error('❌ Firebase Error:', e.message); }
}

// ─── AUTH & ACCESS ──────────────────────────────────────────
function unlockApp() {
    document.getElementById('authOverlay').classList.add('hidden');
    document.getElementById('appContent').classList.remove('hidden');
    updateUI();
}

function showAuthOverlay(show) {
    document.getElementById('authOverlay').classList.toggle('hidden', !show);
}

function enterAsGuest() {
    State.isGuest = true;
    localStorage.setItem('vh4_guest', 'true');
    loadGuestData();
    unlockApp();
    showToast('👻 Entrando como Invitado');
}

function logout() {
    if (!confirm('¿Cerrar sesión?')) return;
    State.firebase.auth?.signOut();
    localStorage.clear();
    location.reload();
}

// ─── DATA SYNC ──────────────────────────────────────────────
function loadGuestData() {
    State.data.water = parseFloat(localStorage.getItem('vh4_water')) || 0;
    State.data.mood = parseInt(localStorage.getItem('vh4_mood')) || 0;
    State.data.name = 'Invitado';
}

async function syncFromFirestore() {
    if (!State.user) return;
    try {
        const doc = await State.firebase.db.collection('users').doc(State.user.uid).get();
        if (doc.exists) {
            State.data = { ...State.data, ...doc.data() };
        }
    } catch (e) { console.warn('Sync Error:', e); }
}

async function saveData() {
    if (State.isGuest) {
        localStorage.setItem('vh4_water', State.data.water);
        localStorage.setItem('vh4_mood', State.data.mood);
    } else if (State.user) {
        State.firebase.db.collection('users').doc(State.user.uid).set(State.data, { merge: true });
    }
    updateUI();
}

// ─── USER ACTIONS ───────────────────────────────────────────
function addWater(amount) {
    State.data.water = parseFloat((State.data.water + amount).toFixed(2));
    showToast(`💧 +${amount}L anotados`);
    saveData();
}

function setMood(val) {
    State.data.mood = val;
    saveData();
}

function calculateBMI() {
    const w = parseFloat(document.getElementById('inWeight').value);
    const h = parseFloat(document.getElementById('inHeight').value) / 100;
    if (w > 0 && h > 0) {
        const bmi = (w / (h * h)).toFixed(1);
        document.getElementById('bmiVal').innerText = bmi;
        document.getElementById('bmiZone').classList.remove('hidden');
        State.data.weight = w;
        State.data.height = h * 100;
        saveData();
    }
}

// ─── IA INTEGRATION ──────────────────────────────────────────
async function generateReport() {
    const query = document.getElementById('searchQuery').value.trim();
    const resultBox = document.getElementById('aiResult');
    const apiKey = window.VITALHUB_CONFIG?.ai?.geminiKey;

    if (!query) return showToast('⚠️ Escribe tu duda primero');
    if (!apiKey) return showToast('🔑 Key de IA no encontrada');

    resultBox.classList.remove('hidden');
    resultBox.innerHTML = '<p><i class="fa-solid fa-spinner fa-spin"></i> Generando informe profesional...</p>';

    const prompt = `Eres un asistente de salud profesional de VitalHub. 
    Proporciona información estructurada y motivadora sobre: ${query}. 
    Usa negritas para puntos clave. Si es una receta, incluye calorías estimadas.`;

    try {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await resp.json();
        const text = data.candidates[0].content.parts[0].text;
        
        resultBox.innerHTML = `
            <div class="report-content">
                <strong><i class="fa-solid fa-file-waveform"></i> Informe de VitalHub AI</strong><br><br>
                ${text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>')}
            </div>
        `;
    } catch (e) {
        resultBox.innerHTML = '<p class="text-danger">❌ Hubo un fallo al conectar con la inteligencia interna.</p>';
    }
}

// ─── UI UPDATES ─────────────────────────────────────────────
function updateUI() {
    document.getElementById('userName').innerText = State.data.name;
    document.getElementById('waterCount').innerText = State.data.water.toFixed(1);
    const waterProgress = Math.min((State.data.water / 2.5) * 100, 100);
    document.getElementById('waterBar').style.width = waterProgress + '%';
    
    // Mood indicators
    document.querySelectorAll('.mood-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', (idx + 1) === State.data.mood);
    });
}

function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('viewTitle').innerText = el.innerText;
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('vh4_theme', next);
    updateThemeUI(next);
}

function updateThemeUI(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.style.display = 'block';
    setTimeout(() => t.style.display = 'none', 3000);
}

// Start
window.addEventListener('DOMContentLoaded', initApp);
