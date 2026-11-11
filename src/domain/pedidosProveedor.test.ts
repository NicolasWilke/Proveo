import { describe, expect, it } from 'vitest';
import { estadoDe, filtrarPedidos, hayFiltros } from './pedidosProveedor';
import { cierreIso } from './rfq';
import type { PedidoCotizacion } from './types';

const AHORA = new Date('2026-11-10T12:00:00-03:00');
const pedido = (id: string, cambios: Partial<PedidoCotizacion> = {}): PedidoCotizacion => ({
  id, compradorId: 'comp', titulo: `Pedido ${id}`, descripcion: '', rubro: 'limpieza',
  items: [{ id: 'a', nombre: 'Horas de limpieza', descripcion: '', cantidad: 10, unidad: 'horas' }],
  cantidad: 10, unidad: 'horas', entrega: '', pago: '', zona: 'Córdoba',
  cierre: '2026-11-20', cierraEn: cierreIso('2026-11-20'), privado: false, invitados: [], sobreCerrado: false,
  documentos: [], adjuntos: [], ofertas: 0, estado: 'abierto', ...cambios,
});

const filas = [
  { p: pedido('A'), yaCotice: false },                                                         // abierto, mi rubro
  { p: pedido('B', { rubro: 'cargas', zona: 'Rosario', cierraEn: cierreIso('2026-11-15') }), yaCotice: false }, // abierto, otro rubro
  { p: pedido('C', { rubro: 'cargas', privado: true, invitados: ['yo'] }), yaCotice: false }, // invitación de otro rubro
  { p: pedido('D', { cierraEn: cierreIso('2026-11-01') }), yaCotice: false },                  // cerró sin que cotice
  { p: pedido('E'), yaCotice: true },                                                           // cotizado, esperando
  { p: pedido('F', { estado: 'adjudicado', cierraEn: cierreIso('2026-11-02') }), yaCotice: true }, // resultado
];
const ids = (xs: { p: PedidoCotizacion }[]) => xs.map((x) => x.p.id);

describe('pedidos del proveedor', () => {
  it('sin filtros muestra todos, también otros rubros y los que cerraron sin cotizar', () => {
    const { visibles, conteo } = filtrarPedidos(filas, {}, ['limpieza'], 'yo', AHORA);
    expect(ids(visibles).sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(conteo).toEqual({ todos: 6, cotizar: 3, cotizados: 1, resultados: 1, cerrados: 1 });
  });
  it('ordena los abiertos por cierre más próximo y deja los cerrados al final', () => {
    const { visibles } = filtrarPedidos(filas, {}, ['limpieza'], 'yo', AHORA);
    expect(ids(visibles)).toEqual(['B', 'A', 'C', 'E', 'F', 'D']);
  });
  it('"solo mis rubros" deja los de mis rubros y las invitaciones', () => {
    expect(ids(filtrarPedidos(filas, { soloMios: true }, ['limpieza'], 'yo', AHORA).visibles).sort()).toEqual(['A', 'C', 'D', 'E', 'F']);
  });
  it('filtra por rubro, estado y texto (sin importar tildes)', () => {
    expect(ids(filtrarPedidos(filas, { rubro: 'cargas' }, [], 'yo', AHORA).visibles).sort()).toEqual(['B', 'C']);
    expect(ids(filtrarPedidos(filas, { estado: 'cotizar' }, [], 'yo', AHORA).visibles).sort()).toEqual(['A', 'B', 'C']);
    expect(ids(filtrarPedidos(filas, { texto: 'cordoba' }, [], 'yo', AHORA).visibles)).not.toContain('B');
    expect(ids(filtrarPedidos(filas, { texto: 'rosario' }, [], 'yo', AHORA).visibles)).toEqual(['B']);
  });
  it('clasifica cada pedido en un solo estado', () => {
    expect(filas.map((x) => estadoDe(x, AHORA))).toEqual(['cotizar', 'cotizar', 'cotizar', 'cerrados', 'cotizados', 'resultados']);
  });
  it('sabe si hay filtros puestos', () => {
    expect(hayFiltros({})).toBe(false);
    expect(hayFiltros({ estado: 'todos' })).toBe(false);
    expect(hayFiltros({ soloMios: true })).toBe(true);
  });
});
