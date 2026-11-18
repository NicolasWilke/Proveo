// Arma un borrador de pedido de cotización con Claude a partir de lo que escribe el comprador.
// La app lo llama desde Nuevo pedido ("Describilo con tus palabras") y con la respuesta llena el formulario.
// El comprador revisa y publica: la IA no publica nada ni pone precios.
//
// Variables en Netlify (Site configuration → Environment variables):
//   ANTHROPIC_API_KEY  clave de la API de Anthropic (console.anthropic.com). Se paga aparte de la suscripción de Claude.
//   IA_MODELO          opcional, por defecto claude-haiku-5-5 (rápido y barato; alcanza para esto)
//   IA_SIN_LOGIN       opcional, "true" para dejar usarla sin sesión de Firebase. Solo para la demo:
//                      cualquiera que encuentre la URL podría gastar tu saldo.
// Para pedir sesión usa VITE_FIREBASE_API_KEY (la misma de la app) o FIREBASE_WEB_API_KEY.
// Sin ANTHROPIC_API_KEY responde 503 y la app muestra que la IA no está configurada.
import { HERRAMIENTA, normalizarBorrador, promptSistema, validarTexto } from '../../src/domain/armarPedido';

const json = (datos: unknown, status = 200) =>
  new Response(JSON.stringify(datos), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });

/** Valida el token de Firebase con la API de Identity Toolkit: si es de otro proyecto o venció, falla. */
async function sesionValida(token: string, apiKey: string): Promise<boolean> {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
  }).catch(() => null);
  if (!r?.ok) return false;
  const datos = (await r.json().catch(() => null)) as { users?: unknown[] } | null;
  return !!datos?.users?.length;
}

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Usá POST.' }, 405);

  const clave = (process.env.ANTHROPIC_API_KEY ?? '').trim().replace(/^["']|["']$/g, '');
  if (!clave) return json({ error: 'La IA todavía no está configurada en este sitio.' }, 503);

  if (process.env.IA_SIN_LOGIN !== 'true') {
    const token = (req.headers.get('authorization') ?? '').replace(/^bearer\s+/i, '').trim();
    const apiKey = (process.env.FIREBASE_WEB_API_KEY ?? process.env.VITE_FIREBASE_API_KEY ?? '').trim();
    if (!token || !apiKey || !(await sesionValida(token, apiKey))) return json({ error: 'Iniciá sesión para usar la IA.' }, 401);
  }

  let texto: string;
  try {
    const cuerpo = (await req.json().catch(() => ({}))) as { texto?: unknown };
    texto = validarTexto(cuerpo.texto);
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }

  const modelo = process.env.IA_MODELO?.trim() || 'claude-haiku-5-5';
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': clave, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: modelo,
      max_tokens: 3000,
      system: promptSistema(),
      tools: [HERRAMIENTA],
      tool_choice: { type: 'tool', name: HERRAMIENTA.name },
      messages: [{ role: 'user', content: texto }],
    }),
  }).catch(() => null);

  if (!r?.ok) {
    const detalle = r ? `${r.status} ${await r.text()}` : 'sin respuesta';
    console.error(`Anthropic respondió ${detalle}`);
    const pista = !r ? 'La IA no respondió. Probá de nuevo.'
      : r.status === 401 ? 'La clave de la IA no es válida: revisá ANTHROPIC_API_KEY en Netlify.'
      : r.status === 404 ? `El modelo "${modelo}" no existe: revisá IA_MODELO en Netlify.`
      : r.status === 400 && /credit/i.test(detalle) ? 'La cuenta de la IA se quedó sin saldo.'
      : r.status === 429 || r.status === 529 ? 'La IA está saturada. Probá de nuevo en un minuto.'
      : 'La IA no respondió. Probá de nuevo.';
    return json({ error: pista }, 502);
  }

  const datos = (await r.json()) as { content?: { type: string; input?: unknown }[] };
  const llamada = datos.content?.find((b) => b.type === 'tool_use');
  try {
    return json({ borrador: normalizarBorrador(llamada?.input) });
  } catch (e) {
    return json({ error: (e as Error).message }, 422);
  }
};

export const config = { path: '/api/armar-pedido' };
