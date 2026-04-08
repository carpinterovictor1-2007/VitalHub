// Firebase Configuration - VitalHub Supreme
const firebaseConfig = {
  apiKey: "AIzaSyCJ6yLsaJCjUdKOnfq2hKiBZHPD9y50Ayo",
  authDomain: "salud-preventiva-a7da3.firebaseapp.com",
  projectId: "salud-preventiva-a7da3",
  storageBucket: "salud-preventiva-a7da3.firebasestorage.app",
  messagingSenderId: "135525184117",
  appId: "1:135525184117:web:50a1ded351cbcc5b38fe3c"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();
const storage = firebase.storage();
