import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAfRAcqsMpcPV2DgAOu-n8XAbxtOyzkpAc",
  authDomain: "appbono-f3a03.firebaseapp.com",
  projectId: "appbono-f3a03",
  storageBucket: "appbono-f3a03.appspot.com",
  messagingSenderId: "167974203598",
  appId: "1:167974203598:web:d85772ab8abd843be9209f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export { db };
