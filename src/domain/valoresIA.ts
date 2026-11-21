import { REGIONES } from './catalogos';
import type { RegionId, ValorReferencia } from './types';
import { posicionEnRango, tieneValor } from './valores';

/**
 * IA en "Valores de referencia". Regla de oro: la IA NO pone precios.
 *
 *  - Adaptar: el comprador cuenta su pedido ("3 operarios, 8 h, lunes a viernes, Rosario"). La IA solo elige
 *    cuál de los valores YA CARGADOS corresponde y desarma la cantidad en factores (3 × 8 × 22). La cuenta
 *    y los pesos los pone este código, con el valor guardado, y se muestra la fuente de ese valor.
 *  - Explicar: el comprador carga una cotización que recibió. Dónde cae respecto del rango lo calcula este
 *    código. La IA solo da motivos posibles y preguntas para el proveedor, sin montos: cualquier frase con
 *    un importe se descarta antes de mostrarla.
 *
 * La llamada vive en netlify/functions/valores-ia.mts (la clave no puede estar en el navegador).
 */

export const TEXTO_MIN = 10;
export const TEXTO_MAX = 1000;
export const CATALOGO_MAX = 300;
const FACTORES_MAX = 6;

/** Lo que la IA ve de cada valor para elegir: nunca los montos. */
export interface ItemCatalogo { id: string; rubro: string; concepto: string; unidad: string; region: string }

export const aCatalogo = (valores: ValorReferencia[]): ItemCatalogo[] =>
  valores.filter(tieneValor).slice(0, CATALOGO_MAX).map((v) => ({ id: v.id, rubro: v.rubro, concepto: v.concepto, unidad: v.unidad, region: v.region }));

export interface Factor { cantidad: number; que: string }

export interface Adaptacion {
  /** id de un valor del catálogo, o '' si ninguno sirve. */
  valorId: string;
  factores: Factor[];
  /** Región que mencionó el comprador ('' si no dijo). */
  region: RegionId | '';
  supuestos: string[];
  faltantes: string[];
}

const IDS_REGION = REGIONES.map((r) => r.id);

/** Formato de respuesta de "adaptar": los ids posibles son solo los del catálogo que se mandó. */
export function esquemaAdaptar(ids: string[]) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['valorId', 'factores', 'region', 'supuestos', 'faltantes'],
    properties: {
      valorId: { type: 'string', enum: [...ids, ''] },
      factores: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['cantidad', 'que'],
          properties: { cantidad: { type: 'number' }, que: { type: 'string' } },
        },
      },
      region: { type: 'string', enum: [...IDS_REGION, ''] },
      supuestos: { type: 'array', items: { type: 'string' } },
      faltantes: { type: 'array', items: { type: 'string' } },
    },
  } as const;
}

export function instruccionesAdaptar(): string {
  const regiones = REGIONES.map((r) => `${r.id} = ${r.nombre}`).join('; ');
  return `Sos el asistente de Unísono, una red B2B de Argentina. Un comprador te cuenta qué necesita contratar o comprar y vos lo traducís a un valor de referencia que ya está cargado y a una cantidad.

Vas a recibir un CATÁLOGO (JSON) con los valores cargados: id, rubro, concepto, unidad y región. No tiene precios y vos no tenés que dar ninguno.

Reglas:
- valorId: el id del catálogo que mejor corresponde a lo que el comprador va a pagar. Si va a contratar a una empresa, preferí el concepto "precio ... que factura la empresa/contratista" antes que un "salario básico" o "conformado" (eso es lo que cobra el trabajador, no lo que paga el cliente), salvo que pida explícitamente el salario. Si el comprador mencionó una región y hay un valor de esa región, usá ese; si no, el nacional. Si nada del catálogo corresponde, devolvé "".
- factores: desarmá la cantidad, en la unidad de ese valor, como una multiplicación de factores que salen del texto. Ej.: "3 operarios, 8 h por día, lunes a viernes durante un mes" con unidad hora = [3 operarios] × [8 horas por día] × [22 días hábiles por mes]. Cada factor con su número y qué es, en pocas palabras. No hagas vos la multiplicación. Máximo ${FACTORES_MAX} factores. Si no se puede saber la cantidad, devolvé factores vacío y anotalo en faltantes.
- Si tuviste que suponer algo para un factor (22 días hábiles por mes, 4,3 semanas por mes, 30 días por mes), anotalo en supuestos en una frase corta.
- region: el id de la región que mencionó (${regiones}), o "" si no mencionó ninguna o no está en la lista.
- faltantes: hasta 3 datos que el comprador no dio y que cambian el cálculo, como pregunta corta. Ej.: "¿Cuántas horas por día?".
- Nunca escribas precios, montos ni porcentajes de aumento. Español rioplatense.`;
}

const corto = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const lista = (v: unknown, max: number, largo = 200) => (Array.isArray(v) ? v : []).map((s) => corto(s, largo)).filter(Boolean).slice(0, max);

/** Limpia la respuesta de "adaptar" y descarta ids que no estén en el catálogo. */
export function normalizarAdaptacion(crudo: unknown, ids: string[]): Adaptacion {
  const o = (crudo && typeof crudo === 'object' ? crudo : {}) as Record<string, unknown>;
  const valorId = typeof o.valorId === 'string' && ids.includes(o.valorId) ? o.valorId : '';
  const factores = (Array.isArray(o.factores) ? o.factores : [])
    .map((x) => {
      const f = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
      return { cantidad: typeof f.cantidad === 'number' && Number.isFinite(f.cantidad) && f.cantidad > 0 ? f.cantidad : 0, que: corto(f.que, 80) };
    })
    .filter((f) => f.cantidad > 0 && f.que)
    .slice(0, FACTORES_MAX);
  const region = (IDS_REGION as string[]).includes(o.region as string) ? (o.region as RegionId) : '';
  return { valorId, factores, region, supuestos: lista(o.supuestos, 3).filter(sinMontos), faltantes: lista(o.faltantes, 3).filter(sinMontos) };
}

/** La cuenta la hace el código, no la IA. 0 si no hay factores. */
export const cantidadDe = (factores: Factor[]) =>
  factores.length ? Math.round(factores.reduce((p, f) => p * f.cantidad, 1) * 100) / 100 : 0;

/* ── Explicar una cotización ─────────────────────────────────────────── */

export type Ubicacion = 'debajo' | 'dentro' | 'arriba';

export interface Comparacion {
  ubicacion: Ubicacion;
  /** Diferencia contra la mediana, en %. */
  vsMediana: number;
  /** 0 = mínimo, 1 = máximo (puede salir de 0–1). */
  posicion: number;
}

export function comparar(precio: number, v: Pick<ValorReferencia, 'min' | 'mediana' | 'max'>): Comparacion {
  const ubicacion: Ubicacion = precio < v.min ? 'debajo' : precio > v.max ? 'arriba' : 'dentro';
  const vsMediana = v.mediana > 0 ? ((precio - v.mediana) / v.mediana) * 100 : 0;
  return { ubicacion, vsMediana: Math.round(vsMediana * 10) / 10, posicion: posicionEnRango(precio, v) };
}

/** Lo que se le manda a la IA para explicar: el valor tal como se muestra, la cotización y la comparación hecha por el código. */
export interface PedidoExplicar {
  valor: Pick<ValorReferencia, 'concepto' | 'unidad' | 'region' | 'fuente' | 'fuenteDetalle' | 'fecha'> & { min: number; mediana: number; max: number; ajustadoPorInflacion: boolean };
  precio: number;
  incluye: string;
  comparacion: Comparacion;
}

export interface Explicacion { lectura: string; motivos: string[]; preguntas: string[] }

export const ESQUEMA_EXPLICAR = {
  type: 'object',
  additionalProperties: false,
  required: ['lectura', 'motivos', 'preguntas'],
  properties: {
    lectura: { type: 'string' },
    motivos: { type: 'array', items: { type: 'string' } },
    preguntas: { type: 'array', items: { type: 'string' } },
  },
} as const;

export function instruccionesExplicar(): string {
  return `Sos el asistente de Unísono, una red B2B de Argentina. Un comprador recibió una cotización y la compara con un valor de referencia. Te llegan en JSON: el valor de referencia (concepto, unidad, mínimo, mediana y máximo sin IVA, fuente, detalle de la fuente y mes), el precio cotizado por la misma unidad, lo que el proveedor dijo que incluye, y la comparación ya calculada (debajo, dentro o arriba del rango y la diferencia contra la mediana).

Tu trabajo es explicar POR QUÉ puede estar esa diferencia y qué preguntarle al proveedor. No recalcules nada: la comparación es la correcta.

Reglas:
- lectura: una o dos frases que digan dónde cae la cotización y cuánto pesa eso según la fuente. Si la fuente es "estimado", aclarás que el rango es una estimación y no precios relevados. Si la fuente es "convenio" y el concepto es un salario (básico o conformado), avisá que se está comparando contra lo que cobra el trabajador y no contra el precio de una empresa, así que es normal que el precio de la empresa sea bastante más alto.
- motivos: hasta 4 razones concretas y posibles para la diferencia, usando lo que dice la fuente y lo que el proveedor incluye (cargas sociales, ART, insumos, supervisión, viáticos, IVA incluido o no, horario nocturno o feriados, volumen, urgencia, zona). Si está por debajo, incluí también los riesgos posibles (personal no registrado, sin seguro, insumos de menor calidad), dichos como posibilidad, no como acusación.
- preguntas: hasta 4 preguntas cortas para hacerle al proveedor antes de decidir.
- No escribas ningún precio, monto ni porcentaje: los números ya se los mostramos al comprador. No inventes datos que no estén en el JSON. Si falta información para explicar, decilo.
- Español rioplatense, tono directo, sin vueltas.`;
}

/** Frases con importes ($ o números de 4 cifras o más) o porcentajes se descartan: los números los pone el código. */
export const sinMontos = (s: string) => !/\$|US\$|\d[\d.,]{3,}|\d\s?%/.test(s);

export function normalizarExplicacion(crudo: unknown): Explicacion {
  const o = (crudo && typeof crudo === 'object' ? crudo : {}) as Record<string, unknown>;
  const frases = corto(o.lectura, 800).split(/(?<=[.!?])\s+/).filter(sinMontos);
  return {
    lectura: frases.join(' '),
    motivos: lista(o.motivos, 4).filter(sinMontos),
    preguntas: lista(o.preguntas, 4).filter(sinMontos),
  };
}

/** Valida lo que llega del navegador para "explicar" (números finitos, textos cortos). */
export function validarExplicar(crudo: unknown): PedidoExplicar | null {
  const o = (crudo && typeof crudo === 'object' ? crudo : {}) as Record<string, unknown>;
  const v = (o.valor && typeof o.valor === 'object' ? o.valor : {}) as Record<string, unknown>;
  const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : NaN);
  const min = n(v.min), mediana = n(v.mediana), max = n(v.max), precio = n(o.precio);
  if ([min, mediana, max, precio].some(Number.isNaN) || max <= 0 || precio <= 0) return null;
  const valor = {
    concepto: corto(v.concepto, 200), unidad: corto(v.unidad, 40), region: corto(v.region, 20) as ValorReferencia['region'],
    fuente: (['cotizaciones', 'arancel', 'convenio', 'estimado'] as const).find((f) => f === v.fuente),
    fuenteDetalle: corto(v.fuenteDetalle, 300) || undefined, fecha: corto(v.fecha, 7) || undefined,
    min, mediana, max, ajustadoPorInflacion: v.ajustadoPorInflacion === true,
  };
  if (!valor.concepto) return null;
  return { valor, precio, incluye: corto(o.incluye, TEXTO_MAX), comparacion: comparar(precio, valor) };
}
