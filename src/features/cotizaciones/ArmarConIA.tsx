import { useEffect, useState } from 'react';
import { evento } from '@/app/medicion';
import { TEXTO_MAX, TEXTO_MIN, type BorradorPedido } from '@/domain/armarPedido';

/**
 * Caja "Contalo con tus palabras": manda el texto a netlify/functions/armar-pedido.mts y devuelve
 * el borrador para llenar el formulario. Solo aparece en el sitio real (Firebase) y si la función
 * dice que tiene la clave de la IA cargada; en la demo y sin clave no se ve.
 */
const URL_IA = '/api/armar-pedido';
const CON_FIREBASE = import.meta.env.VITE_AUTH === 'firebase';

async function tokenDeSesion(): Promise<string> {
  const { firebase } = await import('@/firebase/app');
  const u = firebase().auth.currentUser;
  if (!u) throw new Error('Iniciá sesión para usar la IA.');
  return u.getIdToken();
}

export function ArmarConIA({ onBorrador }: { onBorrador: (b: BorradorPedido) => void }) {
  const [activa, setActiva] = useState(false);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!CON_FIREBASE) return;
    let vivo = true;
    fetch(URL_IA)
      .then((r) => (r.ok ? r.json() : { activa: false }))
      .then((d: { activa?: boolean }) => { if (vivo) setActiva(Boolean(d.activa)); })
      .catch(() => undefined);
    return () => { vivo = false; };
  }, []);

  if (!activa) return null;

  const armar = async () => {
    setError('');
    setCargando(true);
    try {
      const r = await fetch(URL_IA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await tokenDeSesion()}` },
        body: JSON.stringify({ texto: texto.trim() }),
      });
      const d = (await r.json().catch(() => ({}))) as { borrador?: BorradorPedido; error?: string };
      if (!r.ok || !d.borrador) throw new Error(d.error ?? 'La IA no respondió. Probá de nuevo.');
      evento('pedido_armado_ia', { rubro: d.borrador.rubro, items: d.borrador.items.length });
      onBorrador(d.borrador);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'La IA no respondió. Probá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="armar-ia" aria-labelledby="armar-ia-tit">
      <label className="campo" htmlFor="armar-ia-texto">
        <span id="armar-ia-tit"><strong>Contalo con tus palabras</strong> y la IA arma el pedido. Después lo revisás antes de publicar.</span>
        <textarea id="armar-ia-texto" rows={3} maxLength={TEXTO_MAX} value={texto} onChange={(e) => setTexto(e.target.value)}
          placeholder="Ej.: Necesitamos limpieza para la oficina de Rosario, 400 m², de lunes a viernes de 7 a 11, con insumos incluidos. Arrancamos el 1 de diciembre." />
      </label>
      <div className="armar-ia__acc">
        <button type="button" className="btn btn--sec" disabled={cargando || texto.trim().length < TEXTO_MIN} onClick={armar}>
          {cargando ? 'Armando el pedido…' : 'Armar el pedido'}
        </button>
        <span className="tenue">No se publica nada hasta que toques "Publicar pedido".</span>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
