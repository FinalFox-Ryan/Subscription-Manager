import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAEGbIPY2m0q74RqlkGSPp-zNu1a-po71s",
  authDomain: "subscription-manager-6a6d9.firebaseapp.com",
  projectId: "subscription-manager-6a6d9",
  storageBucket: "subscription-manager-6a6d9.firebasestorage.app",
  messagingSenderId: "711064795340",
  appId: "1:711064795340:web:9a5ac2626815ba41a4ea69",
  measurementId: "G-QCGMDT5PY0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);