import { REGION } from '@/config/region';
import { validarRespuestaPedido, validarSolicitud } from '@/domain/reglas';
import { mailDePedido, mailResumenDiario, planDeAvisos } from '@/domain/notificaciones';
import { regionDesdeUbicacion, separarNombre } from '@/domain/acceso';
import { PLANES } from '@/domain/planes';
import { validarResena, validarValor } from '@/domain/resenas';
import { antecedentesDe, antiguedad, validarRespuestaValor, validarSolicitudValor } from '@/domain/antecedentes';
import { adjudicadosDe, validarAdjudicacion, validarCotizacion, validarPedido, validarPregunta, validarRespuestaConsulta } from '@/domain/rfq';
import { esMailCorporativo } from '@/domain/validaciones';
import * as seed from './seed';
import { textoBuscable } from '@/domain/directorio';
import { escalasBase, indicadoresBase } from '../indicadores-base';
const haceDias = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
const antecedentesIniciales = () => seed.antecedentes.map(({ dias, ...a }) => ({ ...a, adjudicado: haceDias(dias) }));
const CLAVE = 'appro:demo:v3';
const URL_PUBLICA = import.meta.env.VITE_PUBLIC_URL ?? 'https://appro.com.ar';
const hoy = () => new Date().toISOString().slice(0, 10);
const clonar = (x) => JSON.parse(JSON.stringify(x));
const inicial = () => {
    const e = clonar({
        compradores: seed.compradores, proveedores: seed.proveedores, solicitudes: seed.solicitudes,
        pedidos: seed.pedidos, cotizaciones: seed.cotizaciones, usos: seed.usos, mails: [], colaResumen: {},
        consultas: seed.consultas, favoritos: seed.favoritos, antecedentes: antecedentesIniciales(), solicitudesValor: [],
    });
    for (const p of e.pedidos)
        p.ofertas = e.cotizaciones.filter((c) => c.pedidoId === p.id).length;
    // La bandeja de la demo arranca con los avisos del pedido más reciente.
    notificar(e, e.pedidos.find((p) => p.id === 'PC-2619'));
    return e;
};
let secuenciaMail = 0;
/** Lo que en producción hace el backend al publicarse un pedido (ver server/notificarPedido.ts). */
function notificar(e, pedido) {
    var _a, _b;
    const comprador = e.compradores.find((c) => c.id === pedido.compradorId);
    if (!comprador)
        return;
    const { inmediatos, diarios } = planDeAvisos(pedido, e.proveedores);
    for (const prov of inmediatos) {
        e.mails.unshift({
            id: `m-${Date.now()}-${++secuenciaMail}`, para: { nombre: `${prov.nombre} ${prov.apellido}`, email: prov.contacto.email },
            ...mailDePedido(pedido, comprador, prov, URL_PUBLICA), tipo: 'pedido', proveedorId: prov.id, pedidoIds: [pedido.id], estado: 'enviado', creado: new Date().toISOString(),
        });
    }
    for (const prov of diarios) {
        const cola = ((_a = e.colaResumen)[_b = prov.id] ?? (_a[_b] = []));
        if (!cola.includes(pedido.id))
            cola.push(pedido.id);
        recomponerResumen(e, prov);
    }
}
function recomponerResumen(e, prov) {
    const ids = e.colaResumen[prov.id] ?? [];
    e.mails = e.mails.filter((m) => !(m.proveedorId === prov.id && m.estado === 'en-cola'));
    if (!ids.length)
        return;
    const items = ids.map((id) => e.pedidos.find((p) => p.id === id)).filter(Boolean)
        .map((pedido) => ({ pedido, comprador: e.compradores.find((c) => c.id === pedido.compradorId) }));
    e.mails.unshift({
        id: `r-${prov.id}-${ids.join('-')}`, para: { nombre: `${prov.nombre} ${prov.apellido}`, email: prov.contacto.email },
        ...mailResumenDiario(items, prov, URL_PUBLICA), tipo: 'resumen', proveedorId: prov.id, pedidoIds: ids, estado: 'en-cola', creado: new Date().toISOString(),
    });
}
function cargar() {
    try {
        const raw = localStorage.getItem(CLAVE);
        if (raw)
            return JSON.parse(raw);
    }
    catch { /* almacenamiento bloqueado: se usa el estado inicial */ }
    return inicial();
}
const ventanaAbierta = (c) => !!c.ventanaHasta && c.ventanaHasta >= hoy();
function coincide(p, f) {
    if (!f)
        return true;
    if (f.rubro && !p.rubros.includes(f.rubro))
        return false;
    // Un proveedor aparece en la región principal y en las que cubre (más de una con el plan Empresa).
    if (f.region && p.region !== f.region && !(p.rol === 'proveedor' && (p.cobertura[f.region] ?? 0) > 0))
        return false;
    if (f.soloVentanaAbierta && p.rol === 'comprador' && !ventanaAbierta(p))
        return false;
    if (f.texto) {
        const t = f.texto.toLowerCase();
        if (!textoBuscable(p).includes(t))
            return false;
    }
    return true;
}
/** Implementación en memoria con persistencia en el navegador. Aplica las mismas reglas de dominio que el backend. */
export class MockRepository {
    constructor() {
        this.estado = cargar();
        this.oyentes = new Set();
        this.secuencia = Date.now() % 100000;
        /** La demo no tiene cuentas reales que sumar: los enlaces se crean pero no se pueden usar. */
        this.invitaciones = [];
    }
    guardar() {
        try {
            localStorage.setItem(CLAVE, JSON.stringify(this.estado));
        }
        catch { /* sin persistencia */ }
        this.oyentes.forEach((fn) => fn());
    }
    id(prefijo) { return `${prefijo}-${++this.secuencia}`; }
    usoDe(id) { var _a; return ((_a = this.estado.usos)[id] ?? (_a[id] = { solicitudesUsadas: 0, respuestasUsadas: 0 })); }
    proveedor(id) {
        const p = this.estado.proveedores.find((x) => x.id === id);
        if (!p)
            throw new Error(`Proveedor ${id} inexistente`);
        return p;
    }
    async listarCompradores(f) { return this.estado.compradores.filter((c) => coincide(c, f)); }
    async listarProveedores(f) { return this.estado.proveedores.filter((p) => coincide(p, f)); }
    async obtenerPersona(id) {
        return this.estado.compradores.find((c) => c.id === id) ?? this.estado.proveedores.find((p) => p.id === id) ?? null;
    }
    async sincronizarCuenta(c) {
        const { nombre, apellido } = separarNombre(c.contactoNombre);
        const comunes = {
            nombre, apellido, empresa: c.empresa.trim(), idFiscal: c.cuit, ciudad: c.ubicacion, logo: c.logoUrl,
            contacto: { email: c.email, telefono: c.telefono },
        };
        const existente = await this.obtenerPersona(c.uid);
        if (existente) {
            Object.assign(existente, comunes);
            if (!existente.rubros.includes(c.categoria))
                existente.rubros = [c.categoria, ...existente.rubros];
            this.guardar();
            return existente;
        }
        const base = {
            ...comunes, id: c.uid, cargo: c.rol === 'comprador' ? 'Responsable de compras' : 'Responsable comercial',
            region: regionDesdeUbicacion(c.ubicacion), rubros: [c.categoria],
            verificaciones: { idFiscal: true, mailCorporativo: esMailCorporativo(c.email, REGION), cargoRevisado: false },
        };
        const persona = c.rol === 'comprador'
            ? { ...base, rol: 'comprador', ventanaHasta: null, foco: c.sector, acepta: 'Pedidos de cotización', noAcepta: 'Llamadas en frío', tasaRespuesta: 0, semiAnonimo: false, circulos: [] }
            : { ...base, rol: 'proveedor', avisos: 'inmediato', plan: 'gratis', desde: new Date().getFullYear(), empleados: '', certificaciones: [], catalogo: c.sector ? [c.sector] : [], cobertura: { [base.region]: 100 }, resenas: [] };
        if (persona.rol === 'comprador')
            this.estado.compradores.push(persona);
        else
            this.estado.proveedores.push(persona);
        this.guardar();
        return persona;
    }
    async solicitudesRecibidas(compradorId) {
        return this.estado.solicitudes.filter((s) => s.compradorId === compradorId).sort((a, b) => b.creada.localeCompare(a.creada));
    }
    async solicitudesEnviadas(proveedorId) {
        return this.estado.solicitudes.filter((s) => s.proveedorId === proveedorId).sort((a, b) => b.creada.localeCompare(a.creada));
    }
    async enviarSolicitud(proveedorId, compradorId, motivo) {
        const prov = this.proveedor(proveedorId);
        const uso = this.usoDe(proveedorId);
        validarSolicitud({
            motivo, plan: prov.plan, uso,
            existentes: this.estado.solicitudes.filter((s) => s.proveedorId === proveedorId && s.compradorId === compradorId),
            compradorRecibe: true,
        });
        const s = { id: this.id('sol'), proveedorId, compradorId, motivo: motivo.trim(), estado: 'pendiente', creada: hoy() };
        this.estado.solicitudes.push(s);
        uso.solicitudesUsadas++;
        this.guardar();
        return s;
    }
    async responderSolicitud(id, estado) {
        const s = this.estado.solicitudes.find((x) => x.id === id);
        if (!s)
            throw new Error('Solicitud inexistente');
        s.estado = estado;
        this.guardar();
    }
    async listarPedidos(f) {
        const visible = (p) => !p.privado || p.compradorId === f?.visorId || (!!f?.visorId && p.invitados.includes(f.visorId));
        return this.estado.pedidos
            .filter((p) => visible(p) && (!f?.compradorId || p.compradorId === f.compradorId)
            && (!f?.rubros || f.rubros.includes(p.rubro) || (!!f.visorId && p.invitados.includes(f.visorId))))
            .sort((a, b) => b.cierraEn.localeCompare(a.cierraEn));
    }
    async obtenerPedido(id) { return this.estado.pedidos.find((p) => p.id === id) ?? null; }
    async publicarPedido(nuevo) {
        validarPedido(nuevo);
        const ultimo = Math.max(...this.estado.pedidos.map((p) => Number(p.id.split('-')[1])));
        const p = { ...clonar(nuevo), invitados: nuevo.privado ? [...nuevo.invitados] : [], id: `PC-${ultimo + 1}`, ofertas: 0, estado: 'abierto' };
        this.estado.pedidos.push(p);
        notificar(this.estado, p);
        this.guardar();
        return p;
    }
    async cotizacionesDe(pedidoId) {
        return this.estado.cotizaciones.filter((c) => c.pedidoId === pedidoId).sort((a, b) => a.precioUnitario - b.precioUnitario);
    }
    async cotizar(nueva) {
        const prov = this.proveedor(nueva.proveedorId);
        const pedido = this.estado.pedidos.find((p) => p.id === nueva.pedidoId);
        if (!pedido)
            throw new Error('Pedido inexistente');
        const uso = this.usoDe(prov.id);
        validarRespuestaPedido({
            plan: prov.plan, uso, pedidoAbierto: pedido.estado === 'abierto',
            yaCotizo: this.estado.cotizaciones.some((c) => c.pedidoId === pedido.id && c.proveedorId === prov.id),
        });
        validarCotizacion(pedido, nueva);
        const c = { ...clonar(nueva), id: this.id('c'), creada: hoy() };
        this.estado.cotizaciones.push(c);
        pedido.ofertas++;
        uso.respuestasUsadas++;
        this.guardar();
        return c;
    }
    async adjudicar(pedidoId, asignacion, comentario, listar = true) {
        const p = this.estado.pedidos.find((x) => x.id === pedidoId);
        if (!p)
            throw new Error('Pedido inexistente');
        validarAdjudicacion(p, await this.cotizacionesDe(pedidoId), asignacion);
        const adjudicados = adjudicadosDe(asignacion);
        Object.assign(p, { estado: 'adjudicado', adjudicadaA: adjudicados[0], adjudicados, adjudicacion: { ...asignacion }, comentarioAdjudicacion: comentario.trim() });
        if (listar) {
            // La demo no guarda el sector de los compradores de ejemplo: sale como "Comprador de la red".
            this.listaAntecedentes().push(...antecedentesDe(p, asignacion, ''));
        }
        this.guardar();
    }
    listaAntecedentes() { var _a; return ((_a = this.estado).antecedentes ?? (_a.antecedentes = antecedentesIniciales())); }
    listaSolicitudesValor() { var _a; return ((_a = this.estado).solicitudesValor ?? (_a.solicitudesValor = [])); }
    async antecedentes() {
        return this.listaAntecedentes().filter((a) => antiguedad(a).estado !== 'vencida').sort((a, b) => b.adjudicado.localeCompare(a.adjudicado));
    }
    async solicitarValor(antecedenteId, compradorId, cantidad, mensaje) {
        const a = this.listaAntecedentes().find((x) => x.id === antecedenteId);
        if (!a)
            throw new Error('Esa compra ya no está en la lista.');
        validarSolicitudValor(a, cantidad, mensaje);
        if (this.listaSolicitudesValor().some((s) => s.antecedenteId === antecedenteId && s.compradorId === compradorId && s.estado === 'pendiente'))
            throw new Error('Ya le pediste el valor de este bien y todavía no respondió.');
        const s = {
            id: this.id('sv'), antecedenteId, nombre: a.nombre, unidad: a.unidad, compradorId, proveedorId: a.proveedorId, cantidad, mensaje: mensaje.trim(),
            estado: 'pendiente', creada: hoy(), precioUnitario: null, vigencia: null, nota: null, respondida: null,
        };
        this.listaSolicitudesValor().unshift(s);
        this.guardar();
        return s;
    }
    async solicitudesValor(f) {
        return this.listaSolicitudesValor().filter((s) => (!f.compradorId || s.compradorId === f.compradorId) && (!f.proveedorId || s.proveedorId === f.proveedorId));
    }
    async responderValor(id, r) {
        const s = this.listaSolicitudesValor().find((x) => x.id === id);
        if (!s || s.estado !== 'pendiente')
            throw new Error('Esta solicitud ya fue respondida.');
        if (r)
            validarRespuestaValor(r.precioUnitario, r.vigencia);
        Object.assign(s, r
            ? { estado: 'respondida', precioUnitario: r.precioUnitario, vigencia: r.vigencia, nota: r.nota.trim(), respondida: hoy() }
            : { estado: 'declinada', respondida: hoy() });
        this.guardar();
    }
    async consultasDe(pedidoId) {
        var _a;
        return ((_a = this.estado).consultas ?? (_a.consultas = clonar(seed.consultas))).filter((c) => c.pedidoId === pedidoId)
            .sort((a, b) => a.creada.localeCompare(b.creada) || a.id.localeCompare(b.id));
    }
    async preguntar(pedidoId, pregunta, proveedorId) {
        var _a;
        const pedido = this.estado.pedidos.find((x) => x.id === pedidoId);
        if (!pedido)
            throw new Error('Pedido inexistente');
        validarPregunta(pedido, proveedorId, pregunta);
        const c = { id: this.id('q'), pedidoId, pregunta: pregunta.trim(), respuesta: null, creada: hoy(), respondida: null };
        ((_a = this.estado).consultas ?? (_a.consultas = clonar(seed.consultas))).push(c);
        this.guardar();
        return c;
    }
    async responderConsulta(pedidoId, consultaId, respuesta) {
        var _a;
        validarRespuestaConsulta(respuesta);
        const c = ((_a = this.estado).consultas ?? (_a.consultas = clonar(seed.consultas))).find((x) => x.id === consultaId && x.pedidoId === pedidoId);
        if (!c)
            throw new Error('Consulta inexistente');
        if (c.respuesta)
            throw new Error('Esta consulta ya tiene respuesta.');
        Object.assign(c, { respuesta: respuesta.trim(), respondida: hoy() });
        this.guardar();
    }
    async favoritos(compradorId) { var _a; return [...(((_a = this.estado).favoritos ?? (_a.favoritos = clonar(seed.favoritos)))[compradorId] ?? [])]; }
    async marcarFavorito(compradorId, proveedorId, favorito) {
        var _a;
        const todos = ((_a = this.estado).favoritos ?? (_a.favoritos = clonar(seed.favoritos)));
        const lista = (todos[compradorId] ?? []).filter((x) => x !== proveedorId);
        todos[compradorId] = favorito ? [...lista, proveedorId] : lista;
        this.guardar();
    }
    async avisosDePedido(pedidoId) {
        const out = [];
        for (const m of this.estado.mails) {
            if (!m.pedidoIds.includes(pedidoId))
                continue;
            out.push({ proveedorId: m.proveedorId, empresa: this.proveedor(m.proveedorId).empresa, via: m.tipo === 'pedido' ? 'mail' : 'resumen' });
        }
        return out;
    }
    async cambiarAvisos(proveedorId, frecuencia) {
        const prov = this.proveedor(proveedorId);
        prov.avisos = frecuencia;
        if (frecuencia !== 'diario')
            delete this.estado.colaResumen[proveedorId];
        recomponerResumen(this.estado, prov);
        this.guardar();
    }
    async bandejaSalida() { return [...this.estado.mails]; }
    async enviarResumenesAhora() {
        let n = 0;
        for (const m of this.estado.mails)
            if (m.estado === 'en-cola') {
                m.estado = 'enviado';
                m.id = `${m.id}-${Date.now()}`;
                n++;
            }
        this.estado.colaResumen = {};
        this.guardar();
        return n;
    }
    async valoresReferencia() {
        const editados = this.estado.valores ?? {};
        return { valores: seed.valores.map((v) => editados[v.id] ?? v), mesesIso: seed.mesesIso, inflacion: seed.inflacion };
    }
    async guardarValor(v) {
        var _a;
        validarValor(v);
        ((_a = this.estado).valores ?? (_a.valores = {}))[v.id] = clonar(v);
        this.guardar();
    }
    async indicadores() {
        return {
            indicadores: indicadoresBase.map((i) => clonar(this.estado.indicadores?.[i.id] ?? i)),
            escalas: escalasBase.map((e) => clonar(this.estado.escalas?.[e.id] ?? e)),
        };
    }
    async guardarIndicador(i) {
        var _a;
        ((_a = this.estado).indicadores ?? (_a.indicadores = {}))[i.id] = clonar({ ...i, actualizado: hoy() });
        this.guardar();
    }
    async guardarEscala(e) {
        var _a;
        ((_a = this.estado).escalas ?? (_a.escalas = {}))[e.id] = clonar({ ...e, actualizado: hoy() });
        this.guardar();
    }
    /** En la demo cualquiera puede probar el panel de administración. */
    async esAdmin() { return true; }
    /** En la demo los planes se activan al elegirlos: no hay pedidos pendientes. */
    async cuentasAdmin() {
        const v = (p) => p.verificaciones.idFiscal && p.verificaciones.mailCorporativo && p.verificaciones.cargoRevisado;
        return [...this.estado.proveedores, ...this.estado.compradores].map((p) => ({
            id: p.id, rol: p.rol, empresa: p.empresa, contactoNombre: `${p.nombre} ${p.apellido}`.trim(), cuit: p.idFiscal, email: p.contacto.email,
            plan: p.rol === 'proveedor' ? p.plan : 'gratis', verificado: v(p), pedido: null,
        })).sort((a, b) => a.empresa.localeCompare(b.empresa));
    }
    async activarPlan(uid, plan) { await this.cambiarPlan(uid, plan); }
    async descartarPedidoPlan() { }
    async verificarCuenta(uid, verificado) {
        const p = await this.obtenerPersona(uid);
        if (!p)
            throw new Error('Cuenta inexistente');
        p.verificaciones = { idFiscal: verificado, mailCorporativo: verificado, cargoRevisado: verificado };
        this.guardar();
    }
    async resenasDePedido(pedidoId) {
        return this.estado.proveedores.flatMap((p) => p.resenas.filter((r) => r.pedidoId === pedidoId).map((r) => ({ ...r, proveedorId: p.id })));
    }
    async resenar(pedidoId, proveedorId, datos) {
        validarResena(datos);
        const pedido = this.estado.pedidos.find((x) => x.id === pedidoId);
        if (!pedido || pedido.estado !== 'adjudicado' || !pedido.adjudicados?.includes(proveedorId))
            throw new Error('Solo se reseña a un proveedor que ganó el pedido.');
        if ((await this.resenasDePedido(pedidoId)).some((r) => r.proveedorId === proveedorId))
            throw new Error('Ya dejaste la reseña de este proveedor.');
        const prov = this.proveedor(proveedorId);
        const comp = this.estado.compradores.find((x) => x.id === pedido.compradorId);
        prov.resenas.unshift({
            ...datos, texto: datos.texto.trim(), pedidoId, proveedorId, fecha: hoy(),
            autor: comp ? `${comp.nombre} ${comp.apellido}` : 'Comprador', empresa: comp?.empresa ?? '',
        });
        this.guardar();
    }
    async indicePrecios() { return { series: seed.series, inflacion: seed.inflacion, meses: seed.meses }; }
    async uso(proveedorId) { return { ...this.usoDe(proveedorId) }; }
    async cambiarPlan(proveedorId, plan) {
        this.proveedor(proveedorId).plan = plan;
        this.guardar();
        return 'activo';
    }
    async equipo() { return { miembros: [], invitaciones: [...this.invitaciones] }; }
    async invitarAlEquipo(_empresaId, etiqueta) {
        const inv = { codigo: `inv-demo-${Date.now().toString(36)}`, etiqueta, creada: hoy(), vence: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) };
        this.invitaciones.push(inv);
        this.guardar();
        return inv;
    }
    async cancelarInvitacion(codigo) { this.invitaciones = this.invitaciones.filter((i) => i.codigo !== codigo); this.guardar(); }
    async quitarDelEquipo() { }
    async cambiarRegiones(proveedorId, extra) {
        const p = this.proveedor(proveedorId);
        const lista = [p.region, ...extra.filter((r) => r !== p.region)];
        if (lista.length > PLANES[p.plan].regiones)
            throw new Error('Tu plan muestra una sola región. Con el plan Empresa sumás varias.');
        // La demo conserva el porcentaje que ya tenía cada región.
        p.cobertura = Object.fromEntries(lista.map((r) => [r, p.cobertura[r] ?? 100]));
        this.guardar();
    }
    async embudo(proveedorId) {
        const enviadas = this.estado.solicitudes.filter((s) => s.proveedorId === proveedorId);
        const aceptadas = enviadas.filter((s) => s.estado === 'aceptada');
        const ganadas = this.estado.pedidos.filter((p) => p.adjudicados?.includes(proveedorId)).length;
        const vistas = this.estado.vistas?.[proveedorId] ?? 0;
        // Base histórica ficticia para que el tablero de la demo tenga volumen.
        return { vistas: 342 + vistas, solicitudes: 14 + enviadas.length, aceptadas: 8 + aceptadas.length, reuniones: 5 + aceptadas.filter((s) => s.reunion).length, ganadas: 2 + ganadas };
    }
    async registrarVista(proveedorId) {
        var _a;
        const v = ((_a = this.estado).vistas ?? (_a.vistas = {}));
        v[proveedorId] = (v[proveedorId] ?? 0) + 1;
        try {
            localStorage.setItem(CLAVE, JSON.stringify(this.estado));
        }
        catch { /* sin persistencia */ }
    }
    async marcarReunion(solicitudId, hubo) {
        const s = this.estado.solicitudes.find((x) => x.id === solicitudId);
        if (!s || s.estado !== 'aceptada')
            throw new Error('Solo se anota una reunión con una solicitud aceptada.');
        s.reunion = hubo;
        this.guardar();
    }
    async enListaEspera(compradorId) { return !!this.estado.listaEspera?.some((x) => x.uid === compradorId); }
    async sumarseListaEspera(compradorId, empresa) {
        var _a;
        const l = ((_a = this.estado).listaEspera ?? (_a.listaEspera = []));
        if (!l.some((x) => x.uid === compradorId))
            l.unshift({ uid: compradorId, empresa, anotado: hoy() });
        this.guardar();
    }
    async listaEspera() { return [...(this.estado.listaEspera ?? [])]; }
    async reiniciarDemo() {
        this.estado = inicial();
        this.guardar();
    }
    suscribir(fn) {
        this.oyentes.add(fn);
        return () => { this.oyentes.delete(fn); };
    }
}
