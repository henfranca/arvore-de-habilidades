// Importa as funções que vamos usar do Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Objeto de configuração que agora lê as variáveis de ambiente
// import.meta.env é a forma como o Vite acede ao ficheiro .env.local
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Inicializa o Firebase com as suas configurações
const app = initializeApp(firebaseConfig);

// Inicializa o Firestore e exporta a instância do banco de dados
// para que possamos usá-la em outros ficheiros do nosso projeto
export const db = getFirestore(app);
