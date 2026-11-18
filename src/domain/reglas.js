import { PLANES } from './planes';
export const MOTIVO_MIN = 40;
export const MOTIVO_MAX = 300;
export class ReglaDeNegocioError extends Error {
    constructor(codigo, mensaje) {
        super(mensaje);
        this.codigo = codigo;
        this.name = 'ReglaDeNegocioError';
    }
}
export function cupoRestante(plan, uso) {
    const p = PLANES[plan];
    return {
        solicitudes: Math.max(0, p.solicitudesMes - uso.solicitudesUsadas),
        respuestas: p.respuestasMes === null ? null : Math.max(0, p.respuestasMes - uso.respuestasUsadas),
    };
}
/** Reglas para que un proveedor pida contacto. Se aplican igual en el mock y en el backend. */
export function validarSolicitud(args) {
    const largo = args.motivo.trim().length;
    if (largo < MOTIVO_MIN)
        throw new ReglaDeNegocioError('MOTIVO_CORTO', `Contá qué ofrecés y por qué encaja en al menos ${MOTIVO_MIN} caracteres.`);
    if (largo > MOTIVO_MAX)
        throw new ReglaDeNegocioError('MOTIVO_LARGO', `El motivo no puede pasar de ${MOTIVO_MAX} caracteres.`);
    if (!args.compradorRecibe)
        throw new ReglaDeNegocioError('NO_RECIBE', 'Este comprador no recibe solicitudes por ahora. Podés responder sus pedidos de cotización.');
    const abierta = args.existentes.find((s) => s.estado === 'pendiente' || s.estado === 'aceptada' || s.estado === 'postergada');
    if (abierta)
        throw new ReglaDeNegocioError('SOLICITUD_DUPLICADA', 'Ya tenés una solicitud abierta con esta persona.');
    if (cupoRestante(args.plan, args.uso).solicitudes === 0)
        throw new ReglaDeNegocioError('CUPO_SOLICITUDES', 'Usaste todas las solicitudes de tu plan este mes. Pasate a un plan con más cupo o esperá al próximo mes.');
}
export function validarRespuestaPedido(args) {
    if (!args.pedidoAbierto)
        throw new ReglaDeNegocioError('PEDIDO_CERRADO', 'Este pedido ya no recibe cotizaciones.');
    if (args.yaCotizo)
        throw new ReglaDeNegocioError('YA_COTIZO', 'Ya mandaste una cotización para este pedido.');
    if (cupoRestante(args.plan, args.uso).respuestas === 0)
        throw new ReglaDeNegocioError('CUPO_RESPUESTAS', 'El plan Gratis incluye 3 respuestas por mes y ya las usaste.');
}
/** El proveedor nunca ve un rechazo: lo ve como solicitud cerrada. */
export function estadoVisibleParaProveedor(estado) {
    return estado === 'rechazada' ? 'cerrada' : estado;
}
export const habilitaCanalDirecto = (s) => s?.estado === 'aceptada';
