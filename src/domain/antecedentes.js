import { ReglaDeNegocioError } from './reglas';
/**
 * Compras recientes (adjudicación por antecedentes): lo que se adjudicó en la red en los últimos 90 días,
 * para que otro comprador sepa que ese bien ya se compró y a quién. Regla central: el precio adjudicado
 * nunca se muestra. Quien lo necesita le pide al proveedor su valor vigente, y el proveedor decide qué informa.
 */
export const VENTANA_DIAS = 90;
export const AVISO_DIAS = 15;
/** Diferencia de cantidad que todavía se considera comparable (el precio cambia con la escala). */
export const TOLERANCIA_CANTIDAD = 0.5;
export const PLAZO_RESPUESTA_HABILES = 3;
export const MENSAJE_VALOR_MAX = 500;
const DIA = 86400000;
const hoyIso = (d) => new Date(d.getTime() - 3 * 3600000).toISOString().slice(0, 10);
/** Un antecedente por ítem adjudicado. El id lo fijan las reglas: pedido--ítem. */
export function antecedentesDe(p, asignacion, sectorComprador, ahora = new Date()) {
    return p.items.filter((i) => asignacion[i.id]).map((i) => ({
        id: `${p.id}--${i.id}`, pedidoId: p.id, itemId: i.id, rubro: p.rubro, nombre: i.nombre, descripcion: i.descripcion,
        cantidad: i.cantidad, unidad: i.unidad, zona: p.zona, sectorComprador, proveedorId: asignacion[i.id], adjudicado: hoyIso(ahora),
    }));
}
export const diasDesde = (iso, ahora = new Date()) => Math.floor((new Date(`${hoyIso(ahora)}T12:00:00Z`).getTime() - new Date(`${iso}T12:00:00Z`).getTime()) / DIA);
export const desdeVentana = (ahora = new Date()) => hoyIso(new Date(ahora.getTime() - VENTANA_DIAS * DIA));
/** Semáforo de antigüedad: vigente, por vencer (quedan 15 días o menos) o vencida (sale de la lista). */
export function antiguedad(a, ahora = new Date()) {
    const quedan = VENTANA_DIAS - diasDesde(a.adjudicado, ahora);
    return { quedan, estado: quedan < 0 ? 'vencida' : quedan <= AVISO_DIAS ? 'por-vencer' : 'vigente' };
}
/** Rango aproximado de cantidad, para no revelar la cantidad exacta del contrato original. */
export function rangoCantidad(n) {
    if (n < 10)
        return [1, 9];
    const base = 10 ** Math.floor(Math.log10(n));
    return n < base * 5 ? [base, base * 5 - 1] : [base * 5, base * 10 - 1];
}
export const cantidadComparable = (adjudicada, pedida) => pedida > 0 && Math.abs(pedida - adjudicada) <= adjudicada * TOLERANCIA_CANTIDAD;
/** Fecha límite para que el proveedor responda: 3 días hábiles (sin contar sábados ni domingos). */
export function venceEn(creada, habiles = PLAZO_RESPUESTA_HABILES) {
    const d = new Date(`${creada}T12:00:00Z`);
    let n = 0;
    while (n < habiles) {
        d.setUTCDate(d.getUTCDate() + 1);
        if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6)
            n++;
    }
    return d.toISOString().slice(0, 10);
}
const invalido = (msg) => new ReglaDeNegocioError('VALOR_INVALIDO', msg);
export function validarSolicitudValor(a, cantidad, mensaje, ahora = new Date()) {
    if (antiguedad(a, ahora).estado === 'vencida')
        throw invalido(`Esta compra tiene más de ${VENTANA_DIAS} días: corresponde pedir cotización.`);
    if (!(cantidad > 0))
        throw invalido('Indicá la cantidad que necesitás.');
    if (mensaje.trim().length > MENSAJE_VALOR_MAX)
        throw invalido(`El mensaje puede tener hasta ${MENSAJE_VALOR_MAX} caracteres.`);
}
export function validarRespuestaValor(precioUnitario, vigencia, ahora = new Date()) {
    if (!(precioUnitario > 0))
        throw invalido('Indicá el valor unitario.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(vigencia) || vigencia < hoyIso(ahora))
        throw invalido('La vigencia tiene que ser hoy o una fecha futura.');
}
