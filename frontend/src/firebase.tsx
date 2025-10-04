// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJNADcj9NGEsotQ6iaLX19hU4QIEQ8EIY",
  authDomain: "z-combinator-79c76.firebaseapp.com",
  databaseURL: "https://z-combinator-79c76-default-rtdb.firebaseio.com/",
  projectId: "z-combinator-79c76",
  storageBucket: "z-combinator-79c76.firebasestorage.app",
  messagingSenderId: "121481708501",
  appId: "1:121481708501:web:642afaa4567737a808f35c",
  measurementId: "G-KX4TEM14HD"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);