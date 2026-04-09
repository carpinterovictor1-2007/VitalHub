/**
 * Firebase Configuration - VitalHub Supreme
 * ========================================
 * Las claves se cargan desde config.js de forma síncrona
 * para garantizar máxima compatibilidad con internet.
 */

const firebaseConfig = {
    apiKey:            window.CONFIG?.FIREBASE_API_KEY,
    authDomain:        window.CONFIG?.FIREBASE_AUTH_DOMAIN,
    projectId:         window.CONFIG?.FIREBASE_PROJECT_ID,
    storageBucket:     window.CONFIG?.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: window.CONFIG?.FIREBASE_MESSAGING_SENDER_ID,
    appId:             window.CONFIG?.FIREBASE_APP_ID
};

// Inicialización global e inmediata
if (!firebaseConfig.apiKey) {
    console.error('❌ Error: No se conectó a internet. Falta config.js');
}

firebase.initializeApp(firebaseConfig);

const auth    = firebase.auth();
const db      = firebase.firestore();
const storage = firebase.storage();
const ADMIN_EMAIL = window.CONFIG?.ADMIN_EMAIL || 'carpinterovictor1@gmail.com';

console.log('🔥🔥 Conectado a los servicios de VitalHub en internet.');