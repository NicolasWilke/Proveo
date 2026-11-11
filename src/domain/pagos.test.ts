import { describe, expect, it } from 'vitest';
import { linkMercadoPago, variableLink } from './pagos';

const LINK = 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=abc123';

describe('link de pago de Mercado Pago', () => {
  it('arma el nombre de la variable por plan y frecuencia', () => {
    expect(variableLink('pro', false)).toBe('VITE_MP_LINK_PRO_MENSUAL');
    expect(variableLink('empresa', true)).toBe('VITE_MP_LINK_EMPRESA_ANUAL');
  });
  it('devuelve el link cargado para el plan y la frecuencia elegidos', () => {
    const links = { VITE_MP_LINK_PRO_MENSUAL: `  ${LINK}\n`, VITE_MP_LINK_PRO_ANUAL: 'https://mpago.la/2xYz' };
    expect(linkMercadoPago('pro', false, links)).toBe(LINK);
    expect(linkMercadoPago('pro', true, links)).toBe('https://mpago.la/2xYz');
  });
  it('sin link cargado, o para el plan gratis, no hay botón', () => {
    expect(linkMercadoPago('empresa', false, {})).toBeNull();
    expect(linkMercadoPago('gratis', false, { VITE_MP_LINK_GRATIS_MENSUAL: LINK })).toBeNull();
  });
  it('rechaza links que no son de Mercado Pago o no van por https', () => {
    expect(linkMercadoPago('pro', false, { VITE_MP_LINK_PRO_MENSUAL: 'https://mercadopago.com.ar.estafa.com/x' })).toBeNull();
    expect(linkMercadoPago('pro', false, { VITE_MP_LINK_PRO_MENSUAL: 'http://www.mercadopago.com.ar/x' })).toBeNull();
    expect(linkMercadoPago('pro', false, { VITE_MP_LINK_PRO_MENSUAL: 'no es un link' })).toBeNull();
  });
});
