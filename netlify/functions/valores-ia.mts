// IA en "Valores de referencia". La IA no pone precios: elige un valor ya cargado y desarma la cantidad
// (adaptar), o explica una diferencia ya calculada sin escribir montos (explicar). Las cuentas las hace la app.
// Usa las mismas variables que armar-pedido (ANTHROPIC_API_KEY, IA_MODELO); tope propio: IA_TOPE_VALORES (30 por usuario y día).
//
// GET  /api/valores-ia → { activa }
// POST /api/valores-ia { modo: 'adaptar', texto, catalogo } → { adaptacion }
// POST /api/valores-ia { modo: 'explicar', valor, precio, incluye } → { explicacion }

import { clave, crearTope, json, pedirJSON, usuarioDelToken } from '../lib/ia';
import {
  CATALOGO_MAX, ESQUEMA_EXPLICAR, TEXTO_MAX, TEXTO_MIN, esquemaAdaptar, instruccionesAdaptar, instruccionesExplicar,
  normalizarAdaptacion, normalizarExplicacion, validarExplicar, type ItemCatalogo,
} from '../../src/domain/valoresIA';

const puedeUsar = crearTope('IA_TOPE_VALORES', 30);

const corto = (s: unknown, max: number) => (typeof s === 'string' ? s.trim().slice(0, max) : '');

function catalogoValido(v: unknown): ItemCatalogo[] {
  return (Array.isArray(v) ? v : []).slice(0, CATALOGO_MAX).map((x) => {
    const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
    return { id: corto(o.id, 80), rubro: corto(o.rubro, 40), concepto: corto(o.concepto, 200), unidad: corto(o.unidad, 40), region: corto(o.region, 20) };
  }).filter((i) => i.id && i.concepto);
}

export default async (req: Request) => {
  if (req.method === 'GET') return json({ activa: Boolean(clave()) });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  if (!clave()) return json({ error: 'La IA no está activada en este sitio.' }, 503);

  const uid = await usuarioDelToken(req);
  if (!uid) return json({ error: 'Iniciá sesión para usar la IA.' }, 401);

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Pedido mal formado.' }, 400);
  }

  if (cuerpo.modo === 'adaptar') {
    const texto = corto(cuerpo.texto, TEXTO_MAX + 1);
    if (texto.length < TEXTO_MIN) return json({ error: 'Contá un poco más: qué, cuánto y dónde.' }, 400);
    if (texto.length > TEXTO_MAX) return json({ error: `El texto puede tener hasta ${TEXTO_MAX} caracteres.` }, 400);
    const catalogo = catalogoValido(cuerpo.catalogo);
    if (!catalogo.length) return json({ error: 'No hay valores cargados para comparar.' }, 400);
    if (!puedeUsar(uid)) return json({ error: 'Llegaste al tope de consultas con IA por hoy.' }, 429);
    const ids = catalogo.map((i) => i.id);
    const r = await pedirJSON('valores-adaptar', uid, instruccionesAdaptar(), `CATÁLOGO:\n${JSON.stringify(catalogo)}\n\nPEDIDO DEL COMPRADOR:\n${texto}`, esquemaAdaptar(ids));
    if (r instanceof Response) return r;
    return json({ adaptacion: normalizarAdaptacion(r, ids) });
  }

  if (cuerpo.modo === 'explicar') {
    const pedido = validarExplicar(cuerpo);
    if (!pedido) return json({ error: 'Faltan datos: el valor de referencia y el precio cotizado.' }, 400);
    if (!puedeUsar(uid)) return json({ error: 'Llegaste al tope de consultas con IA por hoy.' }, 429);
    const r = await pedirJSON('valores-explicar', uid, instruccionesExplicar(), JSON.stringify(pedido), ESQUEMA_EXPLICAR as unknown as Record<string, unknown>);
    if (r instanceof Response) return r;
    return json({ explicacion: normalizarExplicacion(r) });
  }

  return json({ error: 'Modo desconocido.' }, 400);
};

export const config = { path: '/api/valores-ia' };
