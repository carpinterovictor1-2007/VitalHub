/**
 * VitalHub Supreme v4.0 - Global Settings
 * =========================================
 * Única fuente de verdad para la configuración.
 */
window.VITALHUB_CONFIG = {
    firebase: {
        apiKey:            "AIzaSyCJ6yLsaJCjUdKOnfq2hKiBZHPD9y50Ayo",
        authDomain:        "salud-preventiva-a7da3.firebaseapp.com",
        databaseURL:       "https://salud-preventiva-a7da3-default-rtdb.firebaseio.com",
        projectId:         "salud-preventiva-a7da3",
        storageBucket:     "salud-preventiva-a7da3.firebasestorage.app",
        messagingSenderId: "135525184117",
        appId:             "1:135525184117:web:50a1ded351cbcc5b38fe3c"
    },
    ai: {
        geminiKey: "AIzaSyCMkWxcKTQ9cPX1YlXMTKDHErfz1jmeoPs"
    },
    adminEmail: "carpinterovictor1@gmail.com",
    version: "4.0.1-Supreme"
};

console.log(`🚀 VitalHub Core ${window.VITALHUB_CONFIG.version} Initialized with RTDB Support.`);
