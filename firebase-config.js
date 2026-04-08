/**
 * Firebase Configuration - VitalHub Supreme
 * ========================================
 * Las claves se cargan dinámicamente desde el archivo .env
 * mediante el script env-loader.js.
 */

// Global Variable Placeholders
let auth, db, storage, GEMINI_API_KEY;

function initializeDynamicConfig() {
    const config = {
        apiKey:            window.env?.FIREBASE_API_KEY,
        authDomain:        window.env?.FIREBASE_AUTH_DOMAIN,
        projectId:         window.env?.FIREBASE_PROJECT_ID,
        storageBucket:     window.env?.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: window.env?.FIREBASE_MESSAGING_SENDER_ID,
        appId:             window.env?.FIREBASE_APP_ID
    };

    if (!config.apiKey) {
        console.error('❌ Error: No se encontraron las claves de Firebase en .env');
        return false;
    }

    firebase.initializeApp(config);
    auth = firebase.auth();
    db   = firebase.firestore();
    storage = firebase.storage();
    GEMINI_API_KEY = window.env?.GEMINI_API_KEY;

    console.log('🔥🔥 Servicios de Firebase e IA configurados desde .env');
    return true;
}