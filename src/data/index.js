import { crearHttpRepository } from './http/HttpRepository';
import { MockRepository } from './mock/MockRepository';
/**
 * VITE_AUTH=firebase: cuentas y datos en Firebase (Firestore).
 * VITE_DATA_SOURCE=api: API propia. Si no, la demo con datos de ejemplo en el navegador.
 * Firestore se carga aparte para que la demo publicada no lo incluya.
 */
export async function crearRepositorio() {
    if (import.meta.env.VITE_AUTH === 'firebase') {
        const { FirestoreRepository } = await import('./firestore/FirestoreRepository');
        return new FirestoreRepository();
    }
    if (import.meta.env.VITE_DATA_SOURCE === 'api' && import.meta.env.VITE_API_URL) {
        return crearHttpRepository(import.meta.env.VITE_API_URL);
    }
    return new MockRepository();
}
