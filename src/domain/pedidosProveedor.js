import { recibeOfertas } from './rfq';
export const ESTADOS_FILTRO = [
    ['todos', 'Todos'], ['cotizar', 'Para cotizar'], ['cotizados', 'Cotizados'], ['resultados', 'Resultados'], ['cerrados', 'Cerrados sin cotizar'],
];
export function estadoDe({ p, yaCotice }, ahora = new Date()) {
    if (yaCotice)
        return p.estado === 'adjudicado' ? 'resultados' : 'cotizados';
    return recibeOfertas(p, ahora) ? 'cotizar' : 'cerrados';
}
const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Aplica los filtros que no son de estado; sirve también para contar cuántos hay en cada estado. */
export function filtrarSinEstado(filas, f, misRubros, yo) {
    const q = normalizar(f.texto?.trim() ?? '');
    return filas.filter(({ p }) => (!f.rubro || p.rubro === f.rubro)
        && (!f.soloMios || misRubros.includes(p.rubro) || p.invitados.includes(yo))
        && (!q || normalizar(`${p.id} ${p.titulo} ${p.zona} ${p.descripcion} ${p.items.map((i) => i.nombre).join(' ')}`).includes(q)));
}
/** Abiertos primero (el que cierra antes, arriba); después los cerrados, del más reciente al más viejo. */
export function ordenarPedidos(filas, ahora = new Date()) {
    const abierto = (x) => recibeOfertas(x.p, ahora);
    return [...filas].sort((a, b) => {
        if (abierto(a) !== abierto(b))
            return abierto(a) ? -1 : 1;
        const c = a.p.cierraEn.localeCompare(b.p.cierraEn);
        return abierto(a) ? c : -c;
    });
}
export function filtrarPedidos(filas, f, misRubros, yo, ahora = new Date()) {
    const base = filtrarSinEstado(filas, f, misRubros, yo);
    const conteo = Object.fromEntries(ESTADOS_FILTRO.map(([k]) => [k, 0]));
    for (const x of base) {
        conteo.todos++;
        conteo[estadoDe(x, ahora)]++;
    }
    const estado = f.estado ?? 'todos';
    const visibles = ordenarPedidos(estado === 'todos' ? base : base.filter((x) => estadoDe(x, ahora) === estado), ahora);
    return { visibles, conteo };
}
export const hayFiltros = (f) => !!(f.rubro || f.soloMios || f.texto?.trim() || (f.estado && f.estado !== 'todos'));
