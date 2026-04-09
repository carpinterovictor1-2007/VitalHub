/**
 * Firebase Configuration - VitalHub Supreme
 * ========================================
 */

// Variables globales para toda la aplicación
var auth, db, storage, ADMIN_EMAIL;

(function() {
    try {
        const config = {
            apiKey:            window.CONFIG?.FIREBASE_API_KEY,
            authDomain:        window.CONFIG?.FIREBASE_AUTH_DOMAIN,
            projectId:         window.CONFIG?.FIREBASE_PROJECT_ID,
            storageBucket:     window.CONFIG?.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: window.CONFIG?.FIREBASE_MESSAGING_SENDER_ID,
            appId:             window.CONFIG?.FIREBASE_APP_ID
        };

        if (!config.apiKey) {
            console.error('⚠️ Advertencia: No se encontraron claves en config.js. El modo offline/invitado se activará.');
        } else {
            firebase.initializeApp(config);
            auth    = firebase.auth();
            db      = firebase.firestore();
            storage = firebase.storage();
            ADMIN_EMAIL = window.CONFIG?.ADMIN_EMAIL || 'carpinterovictor1@gmail.com';
            console.log('🔥🔥 Firebase conectado con éxito.');
        }
    } catch (e) {
        console.error('❌ Error fatal al inicializar Firebase:', e.message);
    }
})();