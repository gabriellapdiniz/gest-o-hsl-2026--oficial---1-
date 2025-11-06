// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC2mSMMxEubQ9Q9b1LnUzWErMWYvWP3IDU",
  authDomain: "sistema-hsl.firebaseapp.com",
  projectId: "sistema-hsl",
  storageBucket: "sistema-hsl.firebasestorage.app",
  messagingSenderId: "1014566773751",
  appId: "1:1014566773751:web:adcdd326b2c1ce3c3404f2",
  measurementId: "G-VFHE0NTBKT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you need for the app
export const auth = getAuth(app);
export const db = getFirestore(app);
