import { useSyncExternalStore } from 'react';
const CLAVE_CIERRE = 'proveo:instalar-cerrado';
const DIAS_SILENCIO = 30;
let pedido = null;
let estado = { modo: null, cerrado: leerCierre() };
const oyentes = new Set();
const avisar = () => oyentes.forEach((f) => f());
const cambiar = (parcial) => { estado = { ...estado, ...parcial }; avisar(); };
function leerCierre() {
    try {
        const t = Number(localStorage.getItem(CLAVE_CIERRE));
        return !!t && Date.now() - t < DIAS_SILENCIO * 864e5;
    }
    catch {
        return false;
    }
}
export function yaInstalada() {
    return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
}
function esIOS() {
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}
/** Se llama una vez al arrancar, antes de React, para no perder el evento del navegador. */
export function prepararInstalacion() {
    if (import.meta.env.VITE_ROUTER === 'memory' || !('serviceWorker' in navigator))
        return;
    // La demo (sitio sin Firebase) no se ofrece como app: instalada, quedaría atada a datos de prueba
    // y parecería que la app "entra en demo". Se quita el manifiesto y cualquier service worker viejo.
    if (import.meta.env.VITE_AUTH !== 'firebase') {
        document.querySelector('link[rel="manifest"]')?.remove();
        navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => { void r.unregister(); })).catch(() => { });
        return;
    }
    if (import.meta.env.PROD) {
        window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => { }); });
    }
    if (yaInstalada())
        return;
    if (esIOS())
        estado = { ...estado, modo: 'ios' };
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        pedido = e;
        cambiar({ modo: 'nativo' });
    });
    window.addEventListener('appinstalled', () => { pedido = null; cambiar({ modo: null }); });
}
/** Abre el diálogo del navegador. Devuelve true si la persona aceptó. */
export async function instalar() {
    if (!pedido)
        return false;
    const p = pedido;
    pedido = null;
    await p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome === 'accepted')
        cambiar({ modo: null });
    else
        cambiar({ modo: null, cerrado: true }); // Chrome no deja volver a usar el mismo pedido
    return outcome === 'accepted';
}
export function cerrarAviso() {
    try {
        localStorage.setItem(CLAVE_CIERRE, String(Date.now()));
    }
    catch { /* sin persistencia */ }
    cambiar({ cerrado: true });
}
/** Vuelve a mostrar el aviso (desde el pie: "Instalar la app"). */
export function reabrirAviso() {
    try {
        localStorage.removeItem(CLAVE_CIERRE);
    }
    catch { /* nada */ }
    cambiar({ cerrado: false });
}
export function useInstalacion() {
    return useSyncExternalStore((f) => { oyentes.add(f); return () => oyentes.delete(f); }, () => estado);
}
