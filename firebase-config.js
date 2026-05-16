import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.firebasestorage.app",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
};

// Troque os placeholders acima pelas chaves do app Web criado no console do Firebase.
export const firebaseReady = !Object.values(firebaseConfig).some((value) => String(value).startsWith("SEU_") || value === "SUA_API_KEY");

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Cache persistente IndexedDB: mantém o Firestore funcional quando a PWA está offline.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
