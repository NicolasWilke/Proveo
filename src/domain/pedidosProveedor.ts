import { recibeOfertas } from './rfq';
import type { PedidoCotizacion, RubroId } from './types';

/**
 * Pantalla de pedidos del proveedor: por defecto muestra TODOS los pedidos que puede ver (los públicos de
 * la red, de cualquier rubro, y sus invitaciones). Los filtros son opcionales y se suman entre sí.
 */
export type EstadoFiltro = 'todos' | 'cotizar' | 'cotizados' | 'resultados' | 'cerrados';
export const ESTADOS_FILTRO: [EstadoFiltro, string][] = [
  ['todos', 'Todos'], ['cotizar', 'Para cotizar'], ['cotizados', 'Cotizados'], ['resultados', 'Resultados'], ['cerrados', 'Cerrados sin cotizar'],
];

export interface FilaProveedor { p: PedidoCotizacion; yaCotice: boolean }
export interface FiltroPedidos {
  estado?: EstadoFiltro;
  rubro?: RubroId;
  /** Solo los rubros del proveedor y las invitaciones que recibió */
  soloMios?: boolean;
  texto?: string;
}

export function estadoDe({ p, yaCotice }: FilaProveedor, ahora = new Date()): Exclude<EstadoFiltro, 'todos'> {
  if (yaCotice) return p.estado === 'adjudicado' ? 'resultados' : 'cotizados';
  return recibeOfertas(p, ahora) ? 'cotizar' : 'cerrados';
}

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Aplica los filtros que no son de estado; sirve también para contar cuántos hay en cada estado. */
export function filtrarSinEstado<T extends FilaProveedor>(filas: T[], f: FiltroPedidos, misRubros: RubroId[], yo: string): T[] {
  const q = normalizar(f.texto?.trim() ?? '');
  return filas.filter(({ p }) =>
    (!f.rubro || p.rubro === f.rubro)
    && (!f.soloMios || misRubros.includes(p.rubro) || p.invitados.includes(yo))
    && (!q || normalizar(`${p.id} ${p.titulo} ${p.zona} ${p.descripcion} ${p.items.map((i) => i.nombre).join(' ')}`).includes(q)));
}

/** Abiertos primero (el que cierra antes, arriba); después los cerrados, del más reciente al más viejo. */
export function ordenarPedidos<T extends FilaProveedor>(filas: T[], ahora = new Date()): T[] {
  const abierto = (x: T) => recibeOfertas(x.p, ahora);
  return [...filas].sort((a, b) => {
    if (abierto(a) !== abierto(b)) return abierto(a) ? -1 : 1;
    const c = a.p.cierraEn.localeCompare(b.p.cierraEn);
    return abierto(a) ? c : -c;
  });
}

export function filtrarPedidos<T extends FilaProveedor>(filas: T[], f: FiltroPedidos, misRubros: RubroId[], yo: string, ahora = new Date()) {
  const base = filtrarSinEstado(filas, f, misRubros, yo);
  const conteo = Object.fromEntries(ESTADOS_FILTRO.map(([k]) => [k, 0])) as Record<EstadoFiltro, number>;
  for (const x of base) { conteo.todos++; conteo[estadoDe(x, ahora)]++; }
  const estado = f.estado ?? 'todos';
  const visibles = ordenarPedidos(estado === 'todos' ? base : base.filter((x) => estadoDe(x, ahora) === estado), ahora);
  return { visibles, conteo };
}

export const hayFiltros = (f: FiltroPedidos) => !!(f.rubro || f.soloMios || f.texto?.trim() || (f.estado && f.estado !== 'todos'));
