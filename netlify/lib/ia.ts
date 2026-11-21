import Anthropic from '@anthropic-ai/sdk';

// Piezas comunes de las funciones con IA (armar-pedido, valores-ia). La clave de Anthropic vive solo en el servidor.

export const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

export const clave = () => process.env.ANTHROPIC_API_KEY?.trim() ?? '';
export const modelo = () => process.env.IA_MODELO?.trim() || 'claude-opus-5-5';

/** Comprueba el token de Firebase con la API pública de Firebase Auth y devuelve el uid. */
export async function usuarioDelToken(req: Request): Promise<string | null> {
  const token = (req.headers.get('authorization') ?? '').replace(/^bearer\s+/i, '').trim();
  const apiKey = (process.env.FIREBASE_API_KEY ?? process.env.VITE_FIREBASE_API_KEY ?? '').trim();
  if (!apiKey || !token) return null;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
  });
  if (!r.ok) return null;
  const d = (await r.json()) as { users?: { localId?: string }[] };
  return d.users?.[0]?.localId ?? null;
}

/**
 * Tope por usuario y por día. Vive en la memoria de la función: es un freno de mano contra el abuso,
 * no una cuenta exacta (cada instancia lleva la suya). El tope de gasto real se pone en la consola de Anthropic.
 */
export function crearTope(variable: string, porDefecto: number) {
  const usos = new Map<string, number>();
  return (uid: string): boolean => {
    const tope = Number(process.env[variable]) || porDefecto;
    const k = `${new Date().toISOString().slice(0, 10)}:${uid}`;
    const n = usos.get(k) ?? 0;
    if (n >= tope) return false;
    if (usos.size > 5000) usos.clear();
    usos.set(k, n + 1);
    return true;
  };
}

/**
 * Una llamada a la IA que devuelve JSON con el formato `esquema`, o una Response de error lista para devolver.
 * Esfuerzo bajo: son tareas cortas de elegir y explicar, no de razonar largo.
 */
export async function pedirJSON(nombre: string, uid: string, sistema: string, usuario: string, esquema: Record<string, unknown>): Promise<unknown | Response> {
  const client = new Anthropic({ apiKey: clave(), timeout: 25_000, maxRetries: 1 });
  try {
    const r = await client.beta.messages.create({
      model: modelo(),
      max_tokens: 16000,
      // Si el modelo rechaza el pedido por política, la API reintenta con el modelo de respaldo que corresponda.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: { type: 'json_schema', schema: esquema } },
      system: [{ type: 'text', text: sistema, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: usuario }],
    });
    if (r.stop_reason === 'refusal') return json({ error: 'La IA no pudo responder esto.' }, 422);
    const bloque = r.content.find((b) => b.type === 'text');
    if (!bloque || bloque.type !== 'text') return json({ error: 'La IA no devolvió respuesta. Probá de nuevo.' }, 502);
    console.log(`${nombre} uid=${uid} modelo=${r.model} in=${r.usage.input_tokens} out=${r.usage.output_tokens} cache=${r.usage.cache_read_input_tokens ?? 0}`);
    return JSON.parse(bloque.text) as unknown;
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      console.error('ANTHROPIC_API_KEY no es válida.');
      return json({ error: 'La IA no está bien configurada.' }, 503);
    }
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'La IA está saturada. Probá en un minuto.' }, 503);
    if (e instanceof Anthropic.APIError) console.error(`Anthropic respondió ${e.status}: ${e.message}`);
    else console.error(e);
    return json({ error: 'La IA no respondió. Probá de nuevo.' }, 502);
  }
}
