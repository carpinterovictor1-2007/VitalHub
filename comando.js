/**
 * VITALHUB SUPREME - ENGINE V2.7
 * Human-Centric Hybrid Mode (SQLite + LocalStorage)
 */

let apiToken = localStorage.getItem('vH_token') || null;
let isGuest = localStorage.getItem('vH_guest') === 'true';
let healthChart = null;

let userData = {
    name: localStorage.getItem('vH_name') || 'Invitado',
    age: parseInt(localStorage.getItem('vH_age')) || 30,
    water: parseFloat(localStorage.getItem('vH_water')) || 0,
    mood: parseInt(localStorage.getItem('vH_mood')) || 0,
    weight: parseFloat(localStorage.getItem('vH_weight')) || 0,
    height: parseFloat(localStorage.getItem('vH_height')) || 0,
    meds: JSON.parse(localStorage.getItem('vH_meds')) || [],
    history: { water: [1.5, 2.0, 1.8, 2.5, 2.1, 1.9, 0] }
};

// ---- INIT ----
async function init() {
    const savedTheme = localStorage.getItem('vH_theme') || 'light';
    applyTheme(savedTheme);

    if (!apiToken && !isGuest) {
        document.getElementById('authOverlay').classList.remove('hidden');
    } else {
        document.getElementById('authOverlay').classList.add('hidden');
        document.getElementById('appContent').classList.remove('hidden');

        if (apiToken) {
            await loadUserDataFromServer();
        } else {
            setupGuestUI();
        }

        updateDashboard();
        initChart();
        updatePreventionTable();
        renderMedications();

        if (userData.weight > 0) {
            document.getElementById('inputWeight').value = userData.weight;
            document.getElementById('inputHeight').value = userData.height;
            calculateBMI();
        }
    }
}

// ---- AUTH ----
function toggleAuthForm(mode) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    if (mode === 'register') {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
    } else {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value;
    if (!email || !password) return showToast('⚠️ Ingresa tu correo y contraseña');
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('vH_token', data.token);
            localStorage.setItem('vH_guest', 'false');
            localStorage.setItem('vH_name', data.user.name);
            apiToken = data.token;
            isGuest = false;
            showToast('✅ ¡Bienvenido de nuevo!');
            init();
        } else {
            showToast('❌ ' + (data.error || 'Correo o contraseña incorrectos'));
        }
    } catch (e) {
        showToast('⚠️ No se puede conectar al servidor. Intenta más tarde.');
    }
}

async function register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPass').value;
    const age = document.getElementById('regAge').value;
    const gender = document.getElementById('regGender').value;
    if (!name || !email || !password) return showToast('⚠️ Completa todos los campos');
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, age, gender })
        });
        const data = await res.json();
        if (data.userId) {
            showToast('✅ ¡Cuenta creada! Ya puedes ingresar.');
            toggleAuthForm('login');
            document.getElementById('loginEmail').value = email;
        } else {
            showToast('❌ ' + (data.error || 'Error al crear la cuenta'));
        }
    } catch (e) {
        showToast('⚠️ Sin conexión al servidor');
    }
}

function enterAsGuest() {
    localStorage.setItem('vH_guest', 'true');
    localStorage.removeItem('vH_token');
    isGuest = true;
    apiToken = null;
    showToast('👻 Modo Invitado activado');
    init();
}

function logout() {
    if (confirm('¿Quieres salir de la aplicación?')) {
        localStorage.clear();
        location.reload();
    }
}

function setupGuestUI() {
    const label = document.getElementById('syncLabel');
    label.innerHTML = '📱 Solo en este dispositivo';
    label.style.color = 'var(--accent)';
    const syncBadge = document.getElementById('syncStatus');
    syncBadge.style.background = 'rgba(245,158,11,0.1)';
    syncBadge.style.color = 'var(--accent)';
    syncBadge.querySelector('i').className = 'fa-solid fa-mobile-screen';

    document.getElementById('loginReminderBtn').classList.remove('hidden');
}

// ---- SERVER SYNC ----
async function loadUserDataFromServer() {
    try {
        const res = await fetch('/api/me/metrics', {
            headers: { 'Authorization': `Bearer ${apiToken}` }
        });
        if (res.status === 403) return logout();
        const m = await res.json();
        userData.water = m.water || 0;
        userData.mood = m.mood || 0;
        userData.weight = m.weight || 0;
        userData.height = m.height || 0;
        userData.name = localStorage.getItem('vH_name') || 'Usuario';
    } catch (e) { console.warn('No se pudo conectar al servidor'); }
}

async function syncData() {
    if (isGuest) {
        localStorage.setItem('vH_water', userData.water);
        localStorage.setItem('vH_mood', userData.mood);
        localStorage.setItem('vH_weight', userData.weight);
        localStorage.setItem('vH_height', userData.height);
        localStorage.setItem('vH_meds', JSON.stringify(userData.meds));
    } else if (apiToken) {
        try {
            await fetch('/api/me/metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiToken}`
                },
                body: JSON.stringify({ water: userData.water, mood: userData.mood, weight: userData.weight, height: userData.height })
            });
        } catch (e) { /* silent fail */ }
    }
}

// ---- DASHBOARD ----
function updateDashboard() {
    const name = isGuest ? 'Invitado' : userData.name;
    document.getElementById('userName').textContent = name;
    document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();

    const hour = new Date().getHours();
    const greet = hour < 12 ? '☀️ Buenos días' : hour < 19 ? '🌤️ Buenas tardes' : '🌙 Buenas noches';
    document.getElementById('greeting').textContent = `${greet}, ${name}. ${getWaterAdvice()}`;

    document.getElementById('waterVal').textContent = userData.water.toFixed(1);
    const pct = Math.min((userData.water / 2.5) * 100, 100);
    document.getElementById('waterProgress').style.width = pct + '%';

    const remaining = Math.max(2.5 - userData.water, 0).toFixed(1);
    document.getElementById('waterAdvice').textContent = remaining > 0
        ? `Te faltan ${remaining}L para tu meta de hoy 💧`
        : '🎉 ¡Meta de hidratación completada!';

    renderMoodButtons();
    calculateHealthScore();
}

function getWaterAdvice() {
    if (userData.water === 0) return 'Empieza tomando tu primer vaso de agua.';
    if (userData.water < 1.0) return 'Toma más agua, tu cuerpo lo necesita.';
    if (userData.water < 2.0) return 'Vas bien, sigue así.';
    if (userData.water < 2.5) return '¡Casi llegas a tu meta de agua!';
    return '¡Excelente! Has cumplido tu meta de hidratación hoy.';
}

function calculateHealthScore() {
    let score = 50;
    score += Math.min(userData.water * 12, 30);  // max +30
    score += (userData.mood * 4);                  // max +20
    const final = Math.min(Math.round(score), 100);

    document.getElementById('healthScore').textContent = final;
    const label = document.getElementById('healthStatusLabel');
    if (final >= 90) label.textContent = '🏆 Estado Excelente';
    else if (final >= 75) label.textContent = '✅ Muy Bien';
    else if (final >= 55) label.textContent = '📊 Mejorable — ¡Tú puedes!';
    else label.textContent = '💙 Un paso a la vez';
}

// ---- WATER ----
function addWater(amount) {
    userData.water = parseFloat((userData.water + amount).toFixed(2));
    updateDashboard();
    updateChart();
    syncData();
    const ml = amount * 1000;
    showToast(`💧 +${ml}ml registrados ¡Bien hecho!`);
}

// ---- MOOD ----
function setMood(val) {
    userData.mood = val;
    syncData();
    calculateHealthScore();
    renderMoodButtons();
    const labels = ['', '😞 No muy bien hoy', '😕 Algo mal', '😐 Regular, sin novedad', '🙂 Bien, gracias', '😄 ¡Excelente día!'];
    document.getElementById('moodLabel').textContent = labels[val];
}

function renderMoodButtons() {
    document.querySelectorAll('.mood-btn').forEach((btn, i) => {
        btn.classList.toggle('active', (i + 1) === userData.mood);
    });
}

// ---- BMI ----
function calculateBMI() {
    const w = parseFloat(document.getElementById('inputWeight').value);
    const h = parseFloat(document.getElementById('inputHeight').value) / 100;
    const resultEl = document.getElementById('bmiResult');

    if (!w || !h || w <= 0 || h <= 0) { resultEl.classList.add('hidden'); return; }

    userData.weight = w;
    userData.height = h * 100;
    syncData();

    const bmi = (w / (h * h)).toFixed(1);
    resultEl.classList.remove('hidden');
    document.getElementById('bmiValue').textContent = bmi;

    let status = 'Peso Normal ✅', color = 'var(--secondary)', advice = 'Tu peso está en un rango saludable. ¡Sigue así!';
    if (bmi < 18.5) { status = 'Bajo Peso ⚠️'; color = 'var(--accent)'; advice = 'Considera hablar con un médico o nutricionista para mejorar tu alimentación.'; }
    else if (bmi >= 25 && bmi < 30) { status = 'Sobrepeso 📊'; color = 'var(--accent)'; advice = 'Una dieta balanceada y ejercicio regular pueden ayudarte a llegar a tu peso ideal.'; }
    else if (bmi >= 30) { status = 'Obesidad ❌'; color = 'var(--danger)'; advice = 'Es importante consultar a un médico para obtener orientación personalizada.'; }

    document.getElementById('bmiStatus').textContent = status;
    document.getElementById('bmiStatus').style.color = color;
    document.getElementById('bmiAdvice').textContent = advice;
}

// ---- MEDICATIONS ----
function renderMedications() {
    const list = document.getElementById('medicationList');
    if (!userData.meds || userData.meds.length === 0) {
        list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-pills"></i><p>Aún no has agregado medicinas.<br>¡Usa el campo de arriba para empezar!</p></div>`;
        return;
    }
    list.innerHTML = '';
    userData.meds.forEach((m, i) => {
        const div = document.createElement('div');
        div.className = `med-item ${m.taken ? 'taken' : ''}`;
        div.innerHTML = `
            <input type="checkbox" ${m.taken ? 'checked' : ''} onchange="toggleMed(${i})" style="width:18px; height:18px; accent-color:var(--primary);">
            <span style="flex:1; font-weight:600;">${m.name}</span>
            <button onclick="removeMed(${i})" style="background:none; border:none; color:var(--danger); cursor:pointer; padding:0.25rem;"><i class="fa-solid fa-trash-can"></i></button>
        `;
        list.appendChild(div);
    });
}

function addMedication() {
    const input = document.getElementById('medName');
    const name = input.value.trim();
    if (!name) return showToast('⚠️ Escribe el nombre de la medicina');
    userData.meds.push({ name, taken: false });
    input.value = '';
    syncData();
    renderMedications();
    showToast(`💊 ${name} agregada`);
}

function toggleMed(i) {
    userData.meds[i].taken = !userData.meds[i].taken;
    syncData();
    renderMedications();
}

function removeMed(i) {
    const name = userData.meds[i].name;
    userData.meds.splice(i, 1);
    syncData();
    renderMedications();
    showToast(`🗑️ ${name} eliminada`);
}

// ---- AI RECIPE ----
async function generateRecipe() {
    const ingredients = document.getElementById('recipeInput').value.trim();
    const resultDiv = document.getElementById('recipeResult');
    if (!ingredients) return showToast('⚠️ Ingresa ingredientes primero');

    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando tu receta personalizada...';

    try {
        const res = await fetch('/api/recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredients })
        });
        const data = await res.json();
        resultDiv.innerHTML = data.recipe
            ? data.recipe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
            : '<span style="color:var(--danger)">No se pudo generar la receta.</span>';
    } catch (e) {
        resultDiv.innerHTML = '<span style="color:var(--danger)">⚠️ El servidor de IA no está disponible. Inicia el servidor con <code>node server.js</code></span>';
    }
}

// ---- VAULT ----
function simulateFileUpload() {
    const files = JSON.parse(localStorage.getItem('vH_files') || '[]');
    const name = prompt('¿Cómo se llama el documento?', 'Examen de sangre');
    if (!name) return;
    files.push({ name, date: new Date().toLocaleDateString('es-ES') });
    localStorage.setItem('vH_files', JSON.stringify(files));
    renderFiles(files);
    showToast(`📄 "${name}" guardado`);
}

function renderFiles(files) {
    const list = document.getElementById('fileList');
    list.innerHTML = '';
    if (!files || files.length === 0) return;
    files.forEach(f => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `<i class="fa-solid fa-file-medical" style="color:var(--primary)"></i> <strong>${f.name}</strong> <span style="margin-left:auto; color:var(--text-muted); font-size:0.8rem;">${f.date}</span>`;
        list.appendChild(item);
    });
}

// ---- PREVENTION TABLE ----
function updatePreventionTable() {
    const age = userData.age || 30;
    const tbody = document.querySelector('#preventionTable tbody');
    tbody.innerHTML = '';

    const protocols = [
        { name: '🩸 Análisis de sangre completo', freq: 'Cada año', priority: 'Alta', color: '#fee2e2', textColor: '#b91c1c' },
        { name: '🦷 Visita al dentista', freq: 'Cada 6 meses', priority: 'Media', color: '#fef3c7', textColor: '#b45309' },
        { name: '👁️ Revisión de la vista', freq: 'Cada 2 años', priority: 'Media', color: '#fef3c7', textColor: '#b45309' },
        { name: '🫀 Presión arterial', freq: 'Cada año', priority: 'Alta', color: '#fee2e2', textColor: '#b91c1c' },
    ];

    if (age >= 40) protocols.push({ name: '🔬 Examen de cáncer', freq: 'Cada 2 años', priority: 'Urgente', color: '#fee2e2', textColor: '#991b1b' });
    if (age >= 50) protocols.push({ name: '🦴 Densidad ósea', freq: 'Cada 3 años', priority: 'Media', color: '#fef3c7', textColor: '#b45309' });

    protocols.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${p.name}</td>
            <td>${p.freq}</td>
            <td><span style="background:${p.color}; color:${p.textColor}; padding:0.25rem 0.65rem; border-radius:2rem; font-size:0.78rem; font-weight:700;">${p.priority}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// ---- TOOLTIPS ----
function showTip(id) {
    const tip = document.getElementById(id);
    tip.classList.toggle('hidden');
}

// ---- CHART ----
function initChart() {
    const ctx = document.getElementById('healthTrendsChart').getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(37,99,235,0.05)';

    healthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Hoy'],
            datasets: [{
                label: 'Agua tomada (litros)',
                data: [...userData.history.water.slice(0, 6), userData.water],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37,99,235,0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#2563eb',
                pointHoverRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: isDark ? '#94a3b8' : '#64748b', font: { weight: '600' } } },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.parsed.y.toFixed(1)} litros`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 4,
                    grid: { color: gridColor },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b', callback: v => `${v}L` }
                },
                x: {
                    grid: { color: gridColor },
                    ticks: { color: isDark ? '#94a3b8' : '#64748b' }
                }
            }
        }
    });
}

function updateChart() {
    if (healthChart) {
        healthChart.data.datasets[0].data[6] = userData.water;
        healthChart.update();
    }
}

// ---- NAVIGATION ----
function switchTab(id, el) {
    ['dashboard', 'metrics', 'vault', 'pantry', 'prevention'].forEach(t => {
        document.getElementById(`tab-${t}`).classList.add('hidden');
    });
    document.getElementById(`tab-${id}`).classList.remove('hidden');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (el) el.classList.add('active');

    const titles = {
        dashboard: 'Tu Resumen de Hoy',
        metrics: 'Mi Cuerpo',
        vault: 'Mis Documentos',
        pantry: 'Comer Sano',
        prevention: 'Guía de Salud'
    };
    document.getElementById('pageTitle').textContent = titles[id] || id;

    if (id === 'vault') renderFiles(JSON.parse(localStorage.getItem('vH_files') || '[]'));
}

// ---- THEME ----
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('vH_theme', next);
    if (healthChart) { healthChart.destroy(); initChart(); }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('themeIcon');
    const label = document.getElementById('themeLabel');
    if (!icon || !label) return;
    if (theme === 'dark') { icon.className = 'fa-solid fa-sun'; label.textContent = 'Modo Claro'; }
    else { icon.className = 'fa-solid fa-moon'; label.textContent = 'Modo Oscuro'; }
}

// ---- MISC ----
function exportReport() { window.print(); }

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => { t.style.display = 'none'; }, 3500);
}

window.onload = init;
