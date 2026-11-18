import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
/**
 * Una sola instancia de Firebase para la app: la usan la autenticación (src/auth/firebase)
 * y los datos (src/data/firestore). Se carga solo con VITE_AUTH=firebase.
 */
const env = import.meta.env;
const CONFIG = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
};
const EMULADORES = env.VITE_FIREBASE_EMULADORES === 'true';
/** Storage necesita el plan Blaze. En Spark los logos se guardan como imagen chica dentro del perfil. */
export const USA_STORAGE = env.VITE_FIREBASE_STORAGE === 'true';
let servicios = null;
export function firebase() {
    if (servicios)
        return servicios;
    if (!CONFIG.apiKey || !CONFIG.projectId) {
        throw new Error('Faltan las claves de Firebase. Copiá .env.example a .env.local y completá VITE_FIREBASE_*.');
    }
    const app = initializeApp(CONFIG);
    const auth = getAuth(app);
    auth.languageCode = 'es';
    const db = getFirestore(app);
    const storage = USA_STORAGE ? getStorage(app) : null;
    if (EMULADORES) {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        connectFirestoreEmulator(db, '127.0.0.1', 8080);
        if (storage)
            connectStorageEmulator(storage, '127.0.0.1', 9199);
    }
    servicios = { app, auth, db, storage };
    return servicios;
}
