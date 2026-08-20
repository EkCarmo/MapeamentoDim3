import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Evita reinicializar o app no hot-reload do Next.js
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Cache offline: o app continua funcionando com sinal ruim dentro do armazém
// e sincroniza sozinho quando a conexão volta.
// (try/catch evita erro de dupla inicialização no hot-reload do Next.js)
function initDb() {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    return getFirestore(app);
  }
}
export const db = initDb();

export const storage = getStorage(app);
export const auth = getAuth(app);

/** E-mail do usuário logado (gravado nas movimentações e contagens) */
export function currentUserEmail(): string {
  return auth.currentUser?.email || "desconhecido";
}
