import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { insignias } from '@/domain/directorio';
import { recibeOfertas } from '@/domain/rfq';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSesion } from '@/app/session';
import { useContacto, useResponderSolicitud } from '@/auth/AuthProvider';
import { REGION } from '@/config/region';
import { useQuery, useRepo } from '@/data/DataProvider';
import { REGIONES, region } from '@/domain/catalogos';
import { estadoVisibleParaProveedor, habilitaCanalDirecto } from '@/domain/reglas';
import { fmt, t } from '@/i18n';
import { Avatar, Copiable, Estrellas, Pill, Sello, Seccion, Vacio } from '@/ui/primitivas';
import { useToast } from '@/ui/Toast';
import { FichaComprador } from './FichaComprador';
import { PedirContacto } from './PedirContacto';
import { Insignias, promedio } from './TarjetaProveedor';
import { MARCA } from '@/config/marca';
export function Perfil() {
    const { id = '' } = useParams();
    const { data, cargando } = useQuery((r) => r.obtenerPersona(id), [id]);
    if (cargando)
        return _jsx("div", { className: "envoltura pagina" });
    if (!data)
        return _jsx("div", { className: "envoltura pagina", children: _jsx(Vacio, { titulo: "Este perfil no existe o se dio de baja", accion: { a: '/red', texto: 'Volver a la red' } }) });
    return data.rol === 'comprador' ? _jsx(PerfilComprador, { c: data }) : _jsx(PerfilProveedor, { p: data });
}
function PerfilComprador({ c }) {
    const { rol, usuarioId } = useSesion();
    const [abierto, setAbierto] = useState(false);
    const { data: enviadas } = useQuery((r) => rol === 'proveedor' ? r.solicitudesEnviadas(usuarioId) : Promise.resolve([]), [rol, usuarioId]);
    const { data: pedidos } = useQuery((r) => r.listarPedidos({ compradorId: c.id, visorId: usuarioId }), [c.id, usuarioId]);
    const sol = enviadas?.find((s) => s.compradorId === c.id && s.estado !== 'rechazada') ?? enviadas?.find((s) => s.compradorId === c.id);
    const directo = habilitaCanalDirecto(sol);
    const esYo = rol === 'comprador' && usuarioId === c.id;
    const contacto = useContacto(c, directo);
    let accion = null;
    if (rol === 'proveedor') {
        if (!sol || estadoVisibleParaProveedor(sol.estado) === 'cerrada')
            accion = _jsx("button", { className: "btn btn--pri", onClick: () => setAbierto(true), children: t.acciones.pedirContacto });
        else
            accion = _jsxs(Pill, { tono: directo ? 'ok' : 'senal', children: ["Solicitud ", t.estado[estadoVisibleParaProveedor(sol.estado)].toLowerCase()] });
    }
    return (_jsxs("div", { className: "envoltura pagina perfil", children: [_jsxs("div", { className: "perfil__principal", children: [_jsx(FichaComprador, { c: c, nombreVisible: !c.semiAnonimo || directo || esYo, accion: accion, conSello: true, enlace: false }), rol === 'comprador' && !esYo && _jsx("p", { className: "nota", children: "Est\u00E1s viendo este perfil como comprador. Los proveedores ven adem\u00E1s el bot\u00F3n para pedir contacto; su mail y tel\u00E9fono, solo si los acepta." })] }), _jsxs("div", { className: "perfil__lateral", children: [contacto && !esYo && (_jsxs(Seccion, { titulo: "Contacto", children: [sol && directo && _jsxs("p", { className: "tenue", children: ["Acept\u00F3 tu solicitud del ", fmt.fecha(sol.creada), "."] }), _jsx(Copiable, { etiqueta: "Mail", texto: contacto.email }), contacto.telefono && _jsx(Copiable, { etiqueta: "Tel\u00E9fono", texto: contacto.telefono })] })), sol && estadoVisibleParaProveedor(sol.estado) === 'cerrada' && (_jsx("p", { className: "nota", children: "Tu solicitud anterior se cerr\u00F3. No mostramos rechazos: pod\u00E9s volver a intentar con otra propuesta." })), _jsxs(Seccion, { titulo: "Pedidos de cotizaci\u00F3n abiertos", children: [pedidos?.filter((p) => recibeOfertas(p)).map((p) => (_jsxs(Link, { to: `/cotizaciones/${p.id}`, className: "fila-pedido", children: [_jsx("span", { className: "mono tenue", children: p.id }), _jsx("span", { children: p.titulo }), _jsxs("span", { className: "tenue", children: ["Cierra ", fmt.fecha(p.cierre)] })] }, p.id))), pedidos && pedidos.filter((p) => recibeOfertas(p)).length === 0 && _jsx("p", { className: "tenue", children: "No tiene pedidos abiertos ahora." })] })] }), abierto && _jsx(PedirContacto, { comprador: c, proveedorId: usuarioId, onCerrar: () => setAbierto(false) })] }));
}
/**
 * Un comprador abre el perfil de un proveedor: suma una vista al embudo del proveedor.
 * Cuenta una por comprador, proveedor y día en este navegador, para que recargar no infle el número.
 */
function useVistaDeComprador(proveedorId) {
    const { rol, usuarioId } = useSesion();
    const repo = useRepo();
    useEffect(() => {
        if (rol !== 'comprador' || !usuarioId)
            return;
        const clave = `proveo:vista:${usuarioId}:${proveedorId}`;
        const hoy = new Date().toISOString().slice(0, 10);
        try {
            if (localStorage.getItem(clave) === hoy)
                return;
            localStorage.setItem(clave, hoy);
        }
        catch { /* sin almacenamiento: cuenta igual */ }
        repo.registrarVista(proveedorId).catch(() => { });
    }, [rol, usuarioId, proveedorId, repo]);
}
function PerfilProveedor({ p }) {
    const { rol, usuarioId } = useSesion();
    const responder = useResponderSolicitud();
    const avisar = useToast();
    const { data: recibidas } = useQuery((r) => rol === 'comprador' ? r.solicitudesRecibidas(usuarioId) : Promise.resolve([]), [rol, usuarioId]);
    const sol = recibidas?.find((s) => s.proveedorId === p.id);
    const contacto = useContacto(p);
    const esYo = usuarioId === p.id;
    const prom = promedio(p);
    useVistaDeComprador(p.id);
    const sub = (k) => p.resenas.length ? p.resenas.reduce((a, r) => a + r[k], 0) / p.resenas.length : 0;
    return (_jsxs("div", { className: "envoltura pagina perfil", children: [_jsx("div", { className: "perfil__principal", children: _jsxs("article", { className: "vitrina", children: [p.verificaciones.idFiscal && _jsxs(Sello, { className: "vitrina__sello", children: ["Constancia", _jsx("br", {}), REGION.autoridadFiscal] }), _jsxs("div", { className: "vitrina__cab", children: [_jsx(Avatar, { p: p, grande: true }), _jsxs("div", { children: [_jsxs("p", { className: "eyebrow", children: [insignias(p).includes('verificado') ? 'Proveedor verificado' : 'Proveedor', " \u00B7 en ", MARCA.nombre, " desde ", p.desde] }), _jsx("h1", { children: p.empresa }), _jsxs("p", { children: [p.nombre, " ", p.apellido, " \u00B7 ", p.cargo] }), _jsxs("p", { className: "tenue mono", children: [REGION.idFiscal.nombre, " ", p.idFiscal, " \u00B7 ", p.ciudad, p.empleados && ` · ${p.empleados} empleados`] }), rol === 'comprador' && _jsx(BotonFavorito, { proveedorId: p.id, empresa: p.empresa })] })] }), _jsx(Insignias, { p: p }), p.certificaciones.length > 0 && _jsx("div", { className: "chips", children: p.certificaciones.map((x) => _jsx(Pill, { tono: "sello", children: x }, x)) }), p.catalogo.length > 0 && (_jsxs(_Fragment, { children: [_jsx("h2", { className: "sub", children: "Qu\u00E9 ofrece" }), _jsx("ul", { className: "lista-check", children: p.catalogo.map((x) => _jsx("li", { children: x }, x)) })] })), _jsx("h2", { className: "sub", children: "Cobertura operativa" }), _jsx("ul", { className: "cobertura", children: REGIONES.map((r) => {
                                const v = p.cobertura[r.id] ?? 0;
                                return (_jsxs("li", { children: [_jsx("span", { children: r.nombre }), _jsx("span", { className: "cobertura__barra", children: _jsx("span", { style: { width: `${v}%` } }) }), _jsx("span", { className: "mono tenue", children: v ? `${v}%` : '—' })] }, r.id));
                            }) })] }) }), _jsxs("div", { className: "perfil__lateral", children: [rol === 'comprador' && sol?.estado === 'pendiente' && (_jsxs(Seccion, { titulo: "Te pidi\u00F3 contacto", children: [_jsx("blockquote", { className: "motivo", children: sol.motivo }), _jsxs("div", { className: "acciones-sol", children: [_jsx("button", { className: "btn btn--pri", onClick: async () => { await responder(sol, 'aceptada'); avisar(`Aceptaste. ${p.nombre} ya puede escribirte o llamarte.`); }, children: t.acciones.aceptar }), _jsx("button", { className: "btn btn--sec", onClick: () => responder(sol, 'postergada'), children: t.acciones.postergar }), _jsx("button", { className: "btn btn--ter", onClick: () => responder(sol, 'rechazada'), children: t.acciones.rechazar })] })] })), contacto && !esYo && (_jsxs(Seccion, { titulo: "Contacto", children: [_jsx(Copiable, { etiqueta: "Mail", texto: contacto.email }), contacto.telefono && _jsx(Copiable, { etiqueta: "Tel\u00E9fono", texto: contacto.telefono })] })), rol === 'proveedor' && !esYo && _jsx("p", { className: "nota", children: "Entre proveedores no se muestran datos de contacto." }), _jsxs(Seccion, { titulo: "Rese\u00F1as de compradores", extra: prom > 0 ? _jsxs("span", { children: [_jsx(Estrellas, { valor: prom }), " ", _jsx("span", { className: "mono", children: prom.toFixed(1) })] }) : undefined, children: [p.resenas.length === 0 && _jsx("p", { className: "tenue", children: "Todav\u00EDa no tiene rese\u00F1as. Solo pueden rese\u00F1ar compradores con una relaci\u00F3n comercial registrada en la red." }), p.resenas.length > 0 && (_jsxs("dl", { className: "subnotas", children: [_jsxs("div", { children: [_jsx("dt", { children: "Entrega" }), _jsx("dd", { className: "mono", children: sub('entrega').toFixed(1) })] }), _jsxs("div", { children: [_jsx("dt", { children: "Calidad" }), _jsx("dd", { className: "mono", children: sub('calidad').toFixed(1) })] }), _jsxs("div", { children: [_jsx("dt", { children: "Facturaci\u00F3n" }), _jsx("dd", { className: "mono", children: sub('facturacion').toFixed(1) })] })] })), p.resenas.map((r) => (_jsxs("figure", { className: "resena", children: [_jsx("blockquote", { children: r.texto }), _jsxs("figcaption", { children: [r.autor, " \u00B7 ", r.empresa, " \u00B7 ", _jsx("span", { className: "tenue", children: fmt.fecha(r.fecha) })] })] }, r.autor + r.fecha)))] }), _jsxs("p", { className: "tenue", children: ["Regi\u00F3n principal: ", region(p.region).nombre] })] })] }));
}
/** Marca al proveedor como favorito del comprador, para invitarlo rápido a pedidos privados. */
function BotonFavorito({ proveedorId, empresa }) {
    const { usuarioId } = useSesion();
    const repo = useRepo();
    const avisar = useToast();
    const { data: favs } = useQuery((r) => r.favoritos(usuarioId), [usuarioId]);
    if (!favs)
        return null;
    const es = favs.includes(proveedorId);
    const alternar = async () => {
        await repo.marcarFavorito(usuarioId, proveedorId, !es);
        avisar(es ? `${empresa} ya no está en tus favoritos.` : `${empresa} quedó en tus favoritos: lo vas a ver primero al invitar a un pedido privado.`);
    };
    return (_jsxs("button", { className: `btn btn--chico ${es ? 'btn--sec' : 'btn--ter'} favorito`, "aria-pressed": es, onClick: alternar, children: [_jsx("span", { "aria-hidden": "true", children: es ? '★' : '☆' }), " ", es ? 'En favoritos' : 'Agregar a favoritos'] }));
}
