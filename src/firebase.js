import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Objeto firebaseConfig que você colou do site
const firebaseConfig = {
  apiKey: "AIzaSyC36oZKG2p4WJdKb8_1-2zRqgZsUg0_HAA",
  authDomain: "arvore-de-habilidade.firebaseapp.com",
  projectId: "arvore-de-habilidade",
  storageBucket: "arvore-de-habilidade.firebasestorage.app",
  messagingSenderId: "99052037832",
  appId: "1:99052037832:web:18e6b9ff6232860045e7fd"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta a instância do banco de dados para usarmos em outros lugares
export const db = getFirestore(app);