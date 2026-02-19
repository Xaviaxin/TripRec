import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBOL-UwqvZM3TPP80kWL8EHyaNe0KQWVeM",
    authDomain: "triprec-6f5f1.firebaseapp.com",
    projectId: "triprec-6f5f1",
    storageBucket: "triprec-6f5f1.firebasestorage.app",
    messagingSenderId: "986373864434",
    appId: "1:986373864434:web:326dc94022a81b29bc096b",
    measurementId: "G-7RTYN7MX90"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
