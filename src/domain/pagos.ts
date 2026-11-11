import type { PlanId } from './types';

/**
 * Cobro de planes con Mercado Pago Suscripciones, sin integración por API.
 * Cada plan pago se crea a mano en Mercado Pago (Tu negocio → Suscripciones → Crear plan) y su link
 * se carga en Netlify. El proveedor paga ahí; el plan se sigue activando a mano en /admin.
 *
 * Variables (Netlify → Site configuration → Environment variables):
 *   VITE_MP_LINK_PRO_MENSUAL, VITE_MP_LINK_PRO_ANUAL, VITE_MP_LINK_EMPRESA_MENSUAL, VITE_MP_LINK_EMPRESA_ANUAL
 * Si falta la del plan elegido, no se muestra el botón y queda solo la transferencia.
 */
export type LinksPago = Partial<Record<string, string | undefined>>;

const DOMINIOS_MP = ['mercadopago.com.ar', 'mpago.la', 'mpago.li'];

/** Nombre de la variable que guarda el link de un plan y frecuencia. */
export const variableLink = (plan: PlanId, anual: boolean) => `VITE_MP_LINK_${plan.toUpperCase()}_${anual ? 'ANUAL' : 'MENSUAL'}`;

/** Link de Mercado Pago para pagar el plan, o null si no hay uno válido cargado. */
export function linkMercadoPago(plan: PlanId, anual: boolean, links: LinksPago): string | null {
  if (plan === 'gratis') return null;
  const crudo = links[variableLink(plan, anual)]?.trim();
  if (!crudo) return null;
  try {
    const url = new URL(crudo);
    // Solo links de Mercado Pago por https: un error al pegar no puede mandar a la gente a otro sitio.
    const ok = url.protocol === 'https:' && DOMINIOS_MP.some((d) => url.hostname === d || url.hostname.endsWith(`.${d}`));
    return ok ? url.toString() : null;
  } catch {
    return null;
  }
}
