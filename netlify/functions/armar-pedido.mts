// "Armar el pedido con IA": recibe lo que el comprador escribió y devuelve un borrador del formulario.
// La clave de Anthropic vive solo acá (servidor), nunca en el navegador.
//
// Variables en Netlify (Site configuration → Environment variables), solo en el sitio de producción:
//   ANTHROPIC_API_KEY   clave de console.anthropic.com. Sin ella el botón no aparece y no se gasta nada.
//   IA_MODELO           opcional, por defecto claude-opus-5-5 (claude-haiku-5-5 sale ~40 veces menos).
//   IA_TOPE_DIARIO      opcional, pedidos armados por usuario y por día (por defecto 20).
// También usa VITE_FIREBASE_API_KEY (ya cargada) para comprobar que quien llama tiene sesión iniciada.
//
// GET  /api/armar-pedido  → { activa: boolean }  (la app pregunta si mostrar el botón)
// POST /api/armar-pedido  { texto }  con Authorization: Bearer <token de Firebase> → { borrador }

import Anthropic from '@anthropic-ai/sdk';
import { clave, crearTope, json, modelo, usuarioDelToken } from '../lib/ia';
import { ESQUEMA_BORRADOR, TEXTO_MAX, TEXTO_MIN, instrucciones, normalizarBorrador } from '../../src/domain/armarPedido';

const puedeUsar = crearTope('IA_TOPE_DIARIO', 20);

export default async (req: Request) => {
  if (req.method === 'GET') return json({ activa: Boolean(clave()) });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  if (!clave()) return json({ error: 'La IA no está activada en este sitio.' }, 503);

  const uid = await usuarioDelToken(req);
  if (!uid) return json({ error: 'Iniciá sesión para usar la IA.' }, 401);

  let texto = '';
  try {
    texto = String(((await req.json()) as { texto?: unknown }).texto ?? '').trim();
  } catch {
    return json({ error: 'Pedido mal formado.' }, 400);
  }
  if (texto.length < TEXTO_MIN) return json({ error: 'Contá un poco más qué necesitás (qué, cuánto y dónde).' }, 400);
  if (texto.length > TEXTO_MAX) return json({ error: `El texto puede tener hasta ${TEXTO_MAX} caracteres.` }, 400);
  if (!puedeUsar(uid)) return json({ error: 'Llegaste al tope de pedidos armados con IA por hoy. Podés completar el formulario a mano.' }, 429);

  const client = new Anthropic({ apiKey: clave(), timeout: 25_000, maxRetries: 1 });
  try {
    const r = await client.beta.messages.create({
      model: modelo(),
      max_tokens: 16000,
      // Si el modelo rechaza el pedido por política, la API reintenta con el modelo de respaldo que corresponda.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      // Extraer datos de un texto corto no necesita razonamiento largo: esfuerzo bajo = más rápido y más barato.
      output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA_BORRADOR as unknown as Record<string, unknown> } },
      system: [{ type: 'text', text: instrucciones(), cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: texto }],
    });
    if (r.stop_reason === 'refusal') return json({ error: 'La IA no pudo armar este pedido. Completá el formulario a mano.' }, 422);
    const bloque = r.content.find((b) => b.type === 'text');
    if (!bloque || bloque.type !== 'text') return json({ error: 'La IA no devolvió un borrador. Probá de nuevo.' }, 502);
    console.log(`armar-pedido uid=${uid} modelo=${r.model} in=${r.usage.input_tokens} out=${r.usage.output_tokens} cache=${r.usage.cache_read_input_tokens ?? 0}`);
    return json({ borrador: normalizarBorrador(JSON.parse(bloque.text)) });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      console.error('ANTHROPIC_API_KEY no es válida.');
      return json({ error: 'La IA no está bien configurada.' }, 503);
    }
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'La IA está saturada. Probá en un minuto.' }, 503);
    if (e instanceof Anthropic.APIError) {
      console.error(`Anthropic respondió ${e.status}: ${e.message}`);
      return json({ error: 'La IA no respondió. Probá de nuevo o completá el formulario a mano.' }, 502);
    }
    console.error(e);
    return json({ error: 'La IA no respondió. Probá de nuevo o completá el formulario a mano.' }, 502);
  }
};

export const config = { path: '/api/armar-pedido' };
