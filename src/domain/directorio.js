import { PLANES } from './planes';
/**
 * Reputación e insignias del directorio. Todo se calcula con datos que ya están en el perfil:
 * reseñas de compra verificada, verificaciones y certificaciones. Nunca precios.
 */
export const MINIMO_RESENAS = 3;
export const TOP_PROMEDIO = 4.5;
export const TOP_RESENAS = 5;
/** Las reseñas de los últimos 24 meses pesan el doble que las anteriores. */
export const MESES_RECIENTES = 24;
export const PESO_ANTIGUAS = 0.5;
export const COMPARAR_MAX = 4;
const notaDe = (r) => (r.entrega + r.calidad + r.facturacion) / 3;
export function promedioPonderado(p, ahora = new Date()) {
    if (!p.resenas.length)
        return 0;
    const corte = new Date(ahora);
    corte.setMonth(corte.getMonth() - MESES_RECIENTES);
    const limite = corte.toISOString().slice(0, 10);
    let suma = 0;
    let pesos = 0;
    for (const r of p.resenas) {
        const w = r.fecha >= limite ? 1 : PESO_ANTIGUAS;
        suma += notaDe(r) * w;
        pesos += w;
    }
    return suma / pesos;
}
/** El promedio se muestra a partir de 3 reseñas; antes es "proveedor nuevo". */
export const reputacionVisible = (p) => p.resenas.length >= MINIMO_RESENAS;
export function insignias(p, ahora = new Date()) {
    const v = p.verificaciones;
    return [
        ...(v.idFiscal && v.mailCorporativo && v.cargoRevisado ? ['verificado'] : []),
        ...(p.resenas.length >= TOP_RESENAS && promedioPonderado(p, ahora) >= TOP_PROMEDIO ? ['top'] : []),
        ...(p.certificaciones.length ? ['certificado'] : []),
    ];
}
/** El plan Empresa compra visibilidad: en la relevancia va primero, siempre rotulado como publicidad. */
export const esDestacado = (p) => PLANES[p.plan]?.destacado === true;
/**
 * Relevancia: primero los destacados (plan Empresa), después quien tiene el rubro buscado, después la calificación
 * ponderada, después la antigüedad. Los otros órdenes los elige el comprador y no miran el plan.
 */
export function ordenar(lista, orden, rubro, ahora = new Date()) {
    const nota = (p) => reputacionVisible(p) ? promedioPonderado(p, ahora) : 0;
    const cmp = {
        relevancia: (a, b) => Number(esDestacado(b)) - Number(esDestacado(a)) || Number(!!rubro && b.rubros[0] === rubro) - Number(!!rubro && a.rubros[0] === rubro) || nota(b) - nota(a) || a.desde - b.desde,
        calificacion: (a, b) => nota(b) - nota(a) || b.resenas.length - a.resenas.length,
        resenas: (a, b) => b.resenas.length - a.resenas.length,
        antiguedad: (a, b) => a.desde - b.desde,
    };
    return [...lista].sort(cmp[orden]);
}
/** Lo que recorre la búsqueda libre: persona, empresa, ciudad y, en proveedores, lo que ofrecen y sus certificaciones. */
export const textoBuscable = (p) => [p.nombre, p.apellido, p.empresa, p.cargo, p.ciudad, ...(p.rol === 'proveedor' ? [...p.catalogo, ...p.certificaciones] : [])].join(' ').toLowerCase();
