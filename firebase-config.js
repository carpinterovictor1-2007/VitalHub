/**
 * Firebase Configuration - VitalHub Supreme (v3.0)
 * ===============================================
 */

// Declarar variables en el espacio global
var auth, db, storage, ADMIN_EMAIL;

try {
    if (typeof firebase === 'undefined') {
        console.error('❌ Error: SDK de Firebase no detectado. Revisa tu conexión a internet.');
    } else {
        var firebaseConfig = {
            apiKey:            window.CONFIG?.FIREBASE_API_KEY,
            authDomain:        window.CONFIG?.FIREBASE_AUTH_DOMAIN,
            projectId:         window.CONFIG?.FIREBASE_PROJECT_ID,
            storageBucket:     window.CONFIG?.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: window.CONFIG?.FIREBASE_MESSAGING_SENDER_ID,
            appId:             window.CONFIG?.FIREBASE_APP_ID
        };

        if (firebaseConfig.apiKey) {
            // Inicializar solo si no hay una app ya inicializada
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            
            // Asignación explícita a window para evitar errores de ReferenceError
            window.auth    = firebase.auth();
            window.db      = firebase.firestore();
            window.storage = firebase.storage();
            window.ADMIN_EMAIL = window.CONFIG?.ADMIN_EMAIL || 'carpinterovictor1@gmail.com';
            
            // Sincronizar variables locales de este script
            auth = window.auth;
            db = window.db;
            storage = window.storage;
            ADMIN_EMAIL = window.ADMIN_EMAIL;

            console.log('🔥🔥 Firebase (v3.0) inicializado globalmente.');
        } else {
            console.warn('⚠️ No se encontraron claves de Firebase. Activando modo independiente.');
        }
    }
} catch (e) {
    console.error('❌ Error crítico en firebase-config.js:', e.message);
}