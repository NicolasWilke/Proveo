import { RUBROS } from './catalogos';
import { DOCUMENTOS_SUGERIDOS, ITEMS_MAX } from './rfq';
import type { RubroId } from './types';

/**
 * "Armar el pedido con IA": el comprador cuenta con sus palabras qué necesita y la IA lo convierte
 * en un borrador del formulario (rubro, título, ítems con cantidad y unidad, entrega, documentos).
 * Nada se publica solo: el borrador llena el formulario y el comprador lo revisa.
 *
 * Acá está lo que no depende de la IA, para poder probarlo: el texto de instrucciones, el formato
 * de respuesta y la limpieza de lo que vuelve. La llamada vive en netlify/functions/armar-pedido.mts,
 * porque la clave de la API no puede estar en el navegador.
 */

export const TEXTO_MIN = 15;
export const TEXTO_MAX = 2000;

export interface ItemBorrador { nombre: string; descripcion: string; cantidad: number; unidad: string }

export interface BorradorPedido {
  rubro: RubroId;
  titulo: string;
  descripcion: string;
  items: ItemBorrador[];
  entrega: string;
  zona: string;
  documentos: string[];
  /** Lo que el comprador no dijo y los proveedores van a necesitar para cotizar bien. */
  faltantes: string[];
}

const IDS_RUBRO = RUBROS.map((r) => r.id);

/** Formato de respuesta (JSON Schema) que la API respeta al pie de la letra. */
export const ESQUEMA_BORRADOR = {
  type: 'object',
  additionalProperties: false,
  required: ['rubro', 'titulo', 'descripcion', 'items', 'entrega', 'zona', 'documentos', 'faltantes'],
  properties: {
    rubro: { type: 'string', enum: IDS_RUBRO },
    titulo: { type: 'string' },
    descripcion: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['nombre', 'descripcion', 'cantidad', 'unidad'],
        properties: {
          nombre: { type: 'string' },
          descripcion: { type: 'string' },
          cantidad: { type: 'number' },
          unidad: { type: 'string' },
        },
      },
    },
    entrega: { type: 'string' },
    zona: { type: 'string' },
    documentos: { type: 'array', items: { type: 'string', enum: DOCUMENTOS_SUGERIDOS } },
    faltantes: { type: 'array', items: { type: 'string' } },
  },
} as const;

/** Instrucciones fijas (no cambian entre pedidos, así la API las puede guardar en caché). */
export function instrucciones(): string {
  const rubros = RUBROS.map((r) => `- ${r.id}: ${r.nombre} (unidad habitual: ${r.unidad})`).join('\n');
  return `Sos el asistente de compras de Unísono, una red B2B de Argentina donde empresas piden cotizaciones a proveedores.
Un comprador te cuenta con sus palabras qué necesita. Convertilo en un pedido de cotización claro, en español rioplatense, para que varios proveedores coticen cada ítem en el mismo formato.

Reglas:
- rubro: elegí el id que mejor encaje de esta lista. Si hay varios, el del ítem principal.
${rubros}
- titulo: corto y concreto (hasta 80 caracteres), sin el nombre de la empresa. Ej.: "Limpieza de oficinas en Rosario, 5 días por semana".
- descripcion: el contexto que sirve para cotizar (horarios, frecuencia, condiciones, lo que no puede faltar). Máximo 3 oraciones. Vacía si no hay nada más que decir.
- items: separá en ítems lo que se cotiza con precio propio. Cada ítem con nombre corto, descripción técnica (medidas, normas, marca o equivalente; vacía si no se dijo), cantidad y unidad. Usá la unidad habitual del rubro si encaja. Máximo ${ITEMS_MAX} ítems.
- cantidad: solo la que el comprador dijo o se deduce sin dudas (ej.: "2 operarios 8 horas, 22 días" = 352 horas operario). Si no se puede saber, poné 0 y anotalo en faltantes. Nunca inventes números.
- entrega: dónde y en qué plazo, solo si lo dijo. Si no, vacío.
- zona: ciudad o zona que mencione. Si no, vacío.
- documentos: solo los de esta lista que el comprador pida o que sean de rigor para el rubro (por ejemplo seguro y ART para personal en planta): ${DOCUMENTOS_SUGERIDOS.join('; ')}.
- faltantes: hasta 4 datos que el comprador no dio y que un proveedor necesitaría para cotizar bien, escritos como pregunta corta al comprador. Ej.: "¿Cuántos m² tiene la oficina?". Vacío si no falta nada importante.
- No agregues precios, proveedores ni datos que el comprador no haya dado.
- Si el texto no es un pedido de compra, devolvé items vacío y en faltantes explicá qué tendría que contar.`;
}

const corto = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** Limpia la respuesta: recorta largos, descarta ítems sin nombre y valores fuera de catálogo. */
export function normalizarBorrador(crudo: unknown): BorradorPedido {
  const o = (crudo && typeof crudo === 'object' ? crudo : {}) as Record<string, unknown>;
  const rubro = (IDS_RUBRO as string[]).includes(o.rubro as string) ? (o.rubro as RubroId) : RUBROS[0].id;
  const unidadRubro = RUBROS.find((r) => r.id === rubro)!.unidad;
  const items = (Array.isArray(o.items) ? o.items : [])
    .map((x) => {
      const i = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
      const cantidad = typeof i.cantidad === 'number' && Number.isFinite(i.cantidad) && i.cantidad > 0 ? i.cantidad : 0;
      return { nombre: corto(i.nombre, 120), descripcion: corto(i.descripcion, 500), cantidad, unidad: corto(i.unidad, 40) || unidadRubro };
    })
    .filter((i) => i.nombre)
    .slice(0, ITEMS_MAX);
  const lista = (v: unknown, max: number, largo: number) =>
    (Array.isArray(v) ? v : []).map((s) => corto(s, largo)).filter(Boolean).slice(0, max);
  return {
    rubro,
    titulo: corto(o.titulo, 140),
    descripcion: corto(o.descripcion, 1000),
    items,
    entrega: corto(o.entrega, 140),
    zona: corto(o.zona, 80),
    documentos: [...new Set(lista(o.documentos, 10, 120).filter((d) => DOCUMENTOS_SUGERIDOS.includes(d)))],
    faltantes: lista(o.faltantes, 4, 200),
  };
}
