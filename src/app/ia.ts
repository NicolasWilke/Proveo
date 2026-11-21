import { useEffect, useState } from 'react';

/**
 * Cliente de las funciones con IA (netlify/functions/*). Solo existen en el sitio real (Firebase):
 * en la demo y sin ANTHROPIC_API_KEY la función responde { activa: false } y la IA no se muestra.
 */
const CON_FIREBASE = import.meta.env.VITE_AUTH === 'firebase';

/** true si la función dice que tiene la clave cargada. */
export function useIAActiva(url: string): boolean {
  const [activa, setActiva] = useState(false);
  useEffect(() => {
    if (!CON_FIREBASE) return;
    let vivo = true;
    fetch(url)
      .then((r) => (r.ok ? r.json() : { activa: false }))
      .then((d: { activa?: boolean }) => { if (vivo) setActiva(Boolean(d.activa)); })
      .catch(() => undefined);
    return () => { vivo = false; };
  }, [url]);
  return activa;
}

async function tokenDeSesion(): Promise<string> {
  const { firebase } = await import('@/firebase/app');
  const u = firebase().auth.currentUser;
  if (!u) throw new Error('Iniciá sesión para usar la IA.');
  return u.getIdToken();
}

/** POST con la sesión del usuario. Devuelve el JSON o tira un Error con el mensaje para mostrar. */
export async function llamarIA<T>(url: string, cuerpo: unknown): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await tokenDeSesion()}` },
    body: JSON.stringify(cuerpo),
  });
  const d = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(d.error ?? 'La IA no respondió. Probá de nuevo.');
  return d;
}
