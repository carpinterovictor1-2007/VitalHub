/**
 * VITALHUB SUPREME - ENGINE V3.0
 * Firebase Auth + Firestore + Guest Mode (LocalStorage)
 */

const ADMIN_EMAIL = 'carpinterovictor1@gmail.com';
let currentUser = null;
let isGuest = localStorage.getItem('vH_guest') === 'true';
let isAdmin = false;
let healthChart = null;
let userData = {
    name: 'Invitado', age: 30,
    water: 0, mood: 0, weight: 0, height: 0,
    meds: [], history: { water: [1.5, 2.0, 1.8, 2.5, 2.1, 1.9, 0] }
};

// ─── INIT ─────────────────────────────────────────────────
async function init() {
    // Esperar a que el archivo .env se cargue
    if (typeof envPromise !== 'undefined') await envPromise;
    
    // Inicializar Firebase con las claves dinámicas
    const configOk = initializeDynamicConfig();
    if (!configOk) {
        showToast('❌ Error crítico: Falta configuración .env');
        return;
    }

    applyTheme(localStorage.getItem('vH_theme') || 'light');

    if (isGuest) {
        loadGuestData();
        showApp();
        return;
    }

    auth.onAuthStateChanged(async user => {
        if (user) {
            currentUser = user;
            isAdmin = user.email === ADMIN_EMAIL;
            userData.name = user.displayName || user.email.split('@')[0];
            await loadUserDataFromFirestore();
            showApp();
            updatePresence(true);
            startHeartbeat();
        } else {
            showAuth(true);
        }
    });
}

function showApp() {
    document.getElementById('authOverlay').classList.add('hidden');
    document.getElementById('appContent').classList.remove('hidden');
    if (isGuest) setupGuestUI();
    if (isAdmin) setupAdminPanel();
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

function showAuth(show) {
    document.getElementById('authOverlay').classList.toggle('hidden', !show);
    document.getElementById('appContent').classList.toggle('hidden', show);
}

// ─── AUTH FORMS ───────────────────────────────────────────
function toggleAuthForm(mode) {
    const isReg = mode === 'register';
    document.getElementById('loginForm').classList.toggle('active', !isReg);
    document.getElementById('registerForm').classList.toggle('active', isReg);
    document.getElementById('tabLogin').classList.toggle('active', !isReg);
    document.getElementById('tabRegister').classList.toggle('active', isReg);
}

// ─── EMAIL / PASSWORD ─────────────────────────────────────
async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const pw    = document.getElementById('loginPass').value;
    if (!email || !pw) return showToast('⚠️ Ingresa tu correo y contraseña');
    try {
        await auth.signInWithEmailAndPassword(email, pw);
        localStorage.setItem('vH_guest', 'false');
        isGuest = false;
    } catch (e) { showToast('❌ ' + getAuthError(e.code)); }
}

async function register() {
    const name   = document.getElementById('regName').value.trim();
    const email  = document.getElementById('regEmail').value.trim();
    const pw     = document.getElementById('regPass').value;
    const age    = document.getElementById('regAge').value;
    const gender = document.getElementById('regGender').value;
    if (!name || !email || !pw) return showToast('⚠️ Completa todos los campos');
    try {
        const r = await auth.createUserWithEmailAndPassword(email, pw);
        await r.user.updateProfile({ displayName: name });
        await db.collection('users').doc(r.user.uid).set({
            name, email, age: parseInt(age) || 0, gender,
            isAdmin: email === ADMIN_EMAIL,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        localStorage.setItem('vH_guest', 'false');
        isGuest = false;
        showToast('✅ ¡Cuenta creada!');
    } catch (e) { showToast('❌ ' + getAuthError(e.code)); }
}

// ─── GOOGLE ───────────────────────────────────────────────
async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const r = await auth.signInWithPopup(provider);
        await db.collection('users').doc(r.user.uid).set({
            name: r.user.displayName, email: r.user.email,
            isAdmin: r.user.email === ADMIN_EMAIL,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        localStorage.setItem('vH_guest', 'false');
        isGuest = false;
        showToast('✅ ¡Acceso con Google exitoso!');
    } catch (e) {
        if (e.code !== 'auth/popup-closed-by-user') showToast('❌ ' + e.message);
    }
}

function enterAsGuest() {
    localStorage.setItem('vH_guest', 'true');
    isGuest = true; currentUser = null;
    loadGuestData(); showApp();
    showToast('👻 Modo Invitado activado');
}

function logout() {
    if (!confirm('¿Quieres salir de la aplicación?')) return;
    if (currentUser) updatePresence(false);
    auth.signOut().catch(() => {});
    localStorage.clear(); location.reload();
}

function getAuthError(code) {
    return ({
        'auth/user-not-found': 'No existe un usuario con ese correo',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/email-already-in-use': 'El correo ya está registrado',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/invalid-email': 'El correo no es válido',
        'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
    })[code] || 'Error de autenticación';
}

// ─── GUEST MODE ───────────────────────────────────────────
function loadGuestData() {
    userData.water  = parseFloat(localStorage.getItem('vH_water'))  || 0;
    userData.mood   = parseInt(localStorage.getItem('vH_mood'))     || 0;
    userData.weight = parseFloat(localStorage.getItem('vH_weight')) || 0;
    userData.height = parseFloat(localStorage.getItem('vH_height')) || 0;
    userData.meds   = JSON.parse(localStorage.getItem('vH_meds'))   || [];
    userData.name   = localStorage.getItem('vH_name')               || 'Invitado';
    userData.age    = parseInt(localStorage.getItem('vH_age'))      || 30;
}

function setupGuestUI() {
    const label = document.getElementById('syncLabel');
    if (label) { label.innerHTML = '📱 Solo en este dispositivo'; label.style.color = 'var(--accent)'; }
    document.getElementById('loginReminderBtn')?.classList.remove('hidden');
}

// ─── FIRESTORE ────────────────────────────────────────────
async function loadUserDataFromFirestore() {
    if (!currentUser) return;
    try {
        const [mDoc, uDoc, medsDoc] = await Promise.all([
            db.collection('metrics').doc(currentUser.uid).get(),
            db.collection('users').doc(currentUser.uid).get(),
            db.collection('meds').doc(currentUser.uid).get()
        ]);
        if (mDoc.exists) { const m = mDoc.data(); userData.water = m.water||0; userData.mood = m.mood||0; userData.weight = m.weight||0; userData.height = m.height||0; }
        if (uDoc.exists) { userData.age = uDoc.data().age || 30; }
        if (medsDoc.exists) { userData.meds = medsDoc.data().items || []; }
    } catch (e) { console.warn('Error cargando datos Firestore:', e); }
}

async function syncData() {
    if (isGuest) {
        localStorage.setItem('vH_water', userData.water);
        localStorage.setItem('vH_mood', userData.mood);
        localStorage.setItem('vH_weight', userData.weight);
        localStorage.setItem('vH_height', userData.height);
    } else if (currentUser) {
        db.collection('metrics').doc(currentUser.uid).set(
            { water: userData.water, mood: userData.mood, weight: userData.weight, height: userData.height, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
            { merge: true }
        ).catch(() => {});
    }
}

async function syncMeds() {
    if (isGuest) { localStorage.setItem('vH_meds', JSON.stringify(userData.meds)); }
    else if (currentUser) { db.collection('meds').doc(currentUser.uid).set({ items: userData.meds }).catch(() => {}); }
}

// ─── PRESENCE ─────────────────────────────────────────────
function updatePresence(online) {
    if (!currentUser) return;
    db.collection('presence').doc(currentUser.uid).set({
        name: currentUser.displayName || userData.name,
        email: currentUser.email, online,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(() => {});
}

function startHeartbeat() {
    setInterval(() => {
        if (currentUser) db.collection('presence').doc(currentUser.uid).update({ online: true, lastSeen: firebase.firestore.FieldValue.serverTimestamp() }).catch(() => {});
    }, 30000);
}

// ─── ADMIN ────────────────────────────────────────────────
function setupAdminPanel() {
    document.getElementById('adminNavItem')?.classList.remove('hidden');
    const twoMinAgo = () => new Date(Date.now() - 120000);

    db.collection('presence').where('online', '==', true).onSnapshot(snap => {
        const users = [];
        snap.forEach(doc => {
            const d = doc.data();
            const seen = d.lastSeen?.toDate?.() || new Date(0);
            if (seen > twoMinAgo()) users.push({ name: d.name, email: d.email });
        });
        const countEls = [document.getElementById('adminOnlineCount'), document.getElementById('adminOnlineCountDetail')];
        countEls.forEach(el => { if (el) el.textContent = users.length; });
        const list = document.getElementById('adminOnlineList');
        if (list) {
            list.innerHTML = users.length
                ? users.map(u => `<div class="online-item"><div class="online-dot"></div><div><div style="font-weight:700">${u.name}</div><div style="font-size:0.72rem;opacity:0.7">${u.email}</div></div></div>`).join('')
                : '<p style="color:var(--text-muted); font-size:0.85rem; text-align:center;">Ningún usuario conectado</p>';
        }
    });

    db.collection('users').get().then(snap => {
        const el = document.getElementById('adminTotalUsers');
        if (el) el.textContent = snap.size;
    }).catch(() => {});
}

// ─── DASHBOARD ────────────────────────────────────────────
function updateDashboard() {
    const name = isGuest ? 'Invitado' : (userData.name || 'Usuario');
    document.getElementById('userName').textContent = name;
    document.getElementById('userAvatar').textContent = name.charAt(0).toUpperCase();
    const h = new Date().getHours();
    const g = h < 12 ? '☀️ Buenos días' : h < 19 ? '🌤️ Buenas tardes' : '🌙 Buenas noches';
    document.getElementById('greeting').textContent = `${g}, ${name}. ${getWaterAdvice()}`;
    document.getElementById('waterVal').textContent = userData.water.toFixed(1);
    document.getElementById('waterProgress').style.width = Math.min((userData.water/2.5)*100, 100) + '%';
    const rem = Math.max(2.5 - userData.water, 0).toFixed(1);
    document.getElementById('waterAdvice').textContent = rem > 0 ? `Te faltan ${rem}L para tu meta 💧` : '🎉 ¡Meta completada!';
    renderMoodButtons();
    calculateHealthScore();
}

function getWaterAdvice() {
    if (userData.water === 0) return 'Empieza con tu primer vaso de agua.';
    if (userData.water < 1) return 'Tu cuerpo necesita más agua.';
    if (userData.water < 2) return 'Vas bien, sigue así.';
    if (userData.water < 2.5) return '¡Casi en tu meta!';
    return '¡Meta de agua cumplida hoy!';
}

function calculateHealthScore() {
    const final = Math.min(Math.round(50 + Math.min(userData.water*12,30) + userData.mood*4), 100);
    document.getElementById('healthScore').textContent = final;
    const l = document.getElementById('healthStatusLabel');
    if (l) l.textContent = final>=90 ? '🏆 Excelente' : final>=75 ? '✅ Muy Bien' : final>=55 ? '📊 Mejorable' : '💙 Un paso a la vez';
}

function addWater(amount) {
    userData.water = parseFloat((userData.water + amount).toFixed(2));
    updateDashboard(); updateChart(); syncData();
    showToast(`💧 +${amount*1000}ml registrados`);
}

function setMood(val) {
    userData.mood = val; syncData(); calculateHealthScore(); renderMoodButtons();
    const labels = ['','😞 No muy bien','😕 Algo mal','😐 Regular','🙂 Bien','😄 ¡Excelente!'];
    document.getElementById('moodLabel').textContent = labels[val];
}
function renderMoodButtons() { document.querySelectorAll('.mood-btn').forEach((b,i) => b.classList.toggle('active', i+1===userData.mood)); }

// ─── BMI ──────────────────────────────────────────────────
function calculateBMI() {
    const w = parseFloat(document.getElementById('inputWeight')?.value);
    const h = parseFloat(document.getElementById('inputHeight')?.value) / 100;
    const el = document.getElementById('bmiResult');
    if (!el || !w || !h || w<=0 || h<=0) { el?.classList.add('hidden'); return; }
    userData.weight = w; userData.height = h*100; syncData();
    const bmi = (w/(h*h)).toFixed(1);
    el.classList.remove('hidden');
    document.getElementById('bmiValue').textContent = bmi;
    let s='Peso Normal ✅', c='var(--secondary)', a='Tu peso está en rango saludable.';
    if (bmi<18.5){s='Bajo Peso ⚠️';c='var(--accent)';a='Consulta con un nutricionista.';}
    else if (bmi>=25&&bmi<30){s='Sobrepeso 📊';c='var(--accent)';a='Una dieta balanceada te ayudará.';}
    else if (bmi>=30){s='Obesidad ❌';c='var(--danger)';a='Consulta a un médico para orientación.';}
    document.getElementById('bmiStatus').textContent = s;
    document.getElementById('bmiStatus').style.color = c;
    document.getElementById('bmiAdvice').textContent = a;
}

// ─── MEDICATIONS ──────────────────────────────────────────
function renderMedications() {
    const list = document.getElementById('medicationList');
    if (!list) return;
    if (!userData.meds.length) { list.innerHTML=`<div class="empty-state"><i class="fa-solid fa-pills"></i><p>Aún no has agregado medicinas.</p></div>`; return; }
    list.innerHTML = '';
    userData.meds.forEach((m,i) => {
        const d = document.createElement('div');
        d.className = `med-item ${m.taken?'taken':''}`;
        d.innerHTML = `<input type="checkbox" ${m.taken?'checked':''} onchange="toggleMed(${i})" style="width:18px;height:18px;accent-color:var(--primary)"><span style="flex:1;font-weight:600">${m.name}</span><button onclick="removeMed(${i})" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:0.25rem"><i class="fa-solid fa-trash-can"></i></button>`;
        list.appendChild(d);
    });
}
function addMedication() {
    const input = document.getElementById('medName');
    const name = input?.value.trim();
    if (!name) return showToast('⚠️ Escribe el nombre de la medicina');
    userData.meds.push({ name, taken: false });
    if (input) input.value = '';
    syncMeds(); renderMedications(); showToast(`💊 ${name} agregada`);
}
function toggleMed(i) { userData.meds[i].taken = !userData.meds[i].taken; syncMeds(); renderMedications(); }
function removeMed(i) { const n=userData.meds[i].name; userData.meds.splice(i,1); syncMeds(); renderMedications(); showToast(`🗑️ ${n} eliminada`); }


// ─── AI RECIPE ────────────────────────────────────────────
// ─── WEB SEARCH (Reemplaza a la IA) ────────────────────────
function searchHealthWeb() {
    const query = document.getElementById('recipeInput')?.value.trim();
    if (!query) return showToast('⚠️ Ingresa términos de búsqueda');
    
    const resultDiv = document.getElementById('recipeResult');
    resultDiv.style.display = 'block';
    
    // Abrir búsqueda en Google en pestaña nueva de forma segura
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}+receta+saludable+consejo+medico`;
    window.open(searchUrl, '_blank');
    
    showToast('🌐 Abriendo explorador web...');
    
    // Ocultar mensaje después de un momento
    setTimeout(() => {
        resultDiv.style.display = 'none';
    }, 3000);
}

// ─── PREVENTION ───────────────────────────────────────────
function updatePreventionTable() {
    const tbody = document.querySelector('#preventionTable tbody');
    if (!tbody) return;
    const age = userData.age || 30;
    const rows = [
        { name:'🩸 Análisis de sangre', freq:'Cada año', p:'Alta', bg:'#fee2e2', c:'#b91c1c' },
        { name:'🦷 Dentista', freq:'Cada 6 meses', p:'Media', bg:'#fef3c7', c:'#b45309' },
        { name:'👁️ Vista', freq:'Cada 2 años', p:'Media', bg:'#fef3c7', c:'#b45309' },
        { name:'🫀 Presión arterial', freq:'Cada año', p:'Alta', bg:'#fee2e2', c:'#b91c1c' },
    ];
    if (age>=40) rows.push({ name:'🔬 Examen de cáncer', freq:'Cada 2 años', p:'Urgente', bg:'#fee2e2', c:'#991b1b' });
    if (age>=50) rows.push({ name:'🦴 Densidad ósea', freq:'Cada 3 años', p:'Media', bg:'#fef3c7', c:'#b45309' });
    tbody.innerHTML = rows.map(r => `<tr><td>${r.name}</td><td>${r.freq}</td><td><span style="background:${r.bg};color:${r.c};padding:0.25rem 0.65rem;border-radius:2rem;font-size:0.78rem;font-weight:700">${r.p}</span></td></tr>`).join('');
}

// ─── CHART ────────────────────────────────────────────────
function initChart() {
    const canvas = document.getElementById('healthTrendsChart');
    if (!canvas) return;
    if (healthChart) healthChart.destroy();
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    healthChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['Lun','Mar','Mié','Jue','Vie','Sáb','Hoy'],
            datasets: [{ label:'Agua (L)', data:[...userData.history.water.slice(0,6), userData.water], borderColor:'#2563eb', backgroundColor:'rgba(37,99,235,0.08)', fill:true, tension:0.4, pointRadius:6, pointBackgroundColor:'#2563eb' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: isDark?'#94a3b8':'#64748b', font:{ weight:'600' } } } },
            scales: { y: { beginAtZero:true, max:4, ticks:{ color: isDark?'#94a3b8':'#64748b', callback:v=>`${v}L` } }, x: { ticks:{ color: isDark?'#94a3b8':'#64748b' } } }
        }
    });
}
function updateChart() { if (healthChart) { healthChart.data.datasets[0].data[6] = userData.water; healthChart.update(); } }

// ─── NAV ──────────────────────────────────────────────────
function switchTab(id, el) {
    ['dashboard','metrics','pantry','prevention','admin'].forEach(t => { const el=document.getElementById(`tab-${t}`); if(el) el.classList.add('hidden'); });
    document.getElementById(`tab-${id}`)?.classList.remove('hidden');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (el) el.classList.add('active');
    const titles = { dashboard:'Tu Resumen de Hoy', metrics:'Mi Cuerpo', pantry:'Explorador de Salud', prevention:'Guía de Salud', admin:'👑 Panel de Admin' };
    document.getElementById('pageTitle').textContent = titles[id] || id;
}

// ─── THEME ────────────────────────────────────────────────
function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next); localStorage.setItem('vH_theme', next);
    if (healthChart) initChart();
}
function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    const icon = document.getElementById('themeIcon'), label = document.getElementById('themeLabel');
    if (!icon||!label) return;
    icon.className = t==='dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    label.textContent = t==='dark' ? 'Modo Claro' : 'Modo Oscuro';
}

// ─── MISC ─────────────────────────────────────────────────
function showTip(id) { document.getElementById(id)?.classList.toggle('hidden'); }
function exportReport() { window.print(); }

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.style.display = 'block';
    clearTimeout(window._toast);
    window._toast = setTimeout(() => t.style.display='none', 3500);
}

window.onload = init;
