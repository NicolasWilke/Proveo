import type { BorradorPedido } from '@/domain/armarPedido';

/** Token de la sesión de Firebase para que la función sepa que quien pide está registrado. En la demo no hay. */
async function token(): Promise<string | null> {
  if (import.meta.env.VITE_AUTH !== 'firebase') return null;
  const { firebase } = await import('@/firebase/app');
  return (await firebase().auth.currentUser?.getIdToken()) ?? null;
}

/** Pide a la función de Netlify (netlify/functions/armar-pedido.mts) un borrador del pedido. */
export async function armarPedidoConIA(texto: string): Promise<BorradorPedido> {
  const t = await token();
  let r: Response;
  try {
    r = await fetch('/api/armar-pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      body: JSON.stringify({ texto }),
    });
  } catch {
    throw new Error('No hay conexión. Revisá internet y probá de nuevo.');
  }
  const datos = (await r.json().catch(() => null)) as { borrador?: BorradorPedido; error?: string } | null;
  if (r.ok && datos?.borrador) return datos.borrador;
  if (datos?.error) throw new Error(datos.error);
  throw new Error(r.status === 404
    ? 'La IA no está disponible en esta versión. Probala en el sitio publicado en Netlify o corriendo "npx netlify dev".'
    : 'La IA no respondió. Probá de nuevo.');
}
