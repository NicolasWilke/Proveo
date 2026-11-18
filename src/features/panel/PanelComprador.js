import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useSesion } from '@/app/session';
import { useResponderSolicitud } from '@/auth/AuthProvider';
import { useQuery } from '@/data/DataProvider';
import { recibeOfertas } from '@/domain/rfq';
import { fmt, t } from '@/i18n';
import { Avatar, Pill, Seccion, Vacio } from '@/ui/primitivas';
import { useToast } from '@/ui/Toast';
import { ContactoPersona } from '../red/ContactoPersona';
import { TarjetaProveedor } from '../red/TarjetaProveedor';
import { PrimerosPasos } from './PrimerosPasos';
export function PanelComprador() {
    const { usuarioId } = useSesion();
    const { data } = useQuery(async (r) => {
        const yo = (await r.obtenerPersona(usuarioId));
        const [sols, provs, pedidos, favoritos] = await Promise.all([r.solicitudesRecibidas(usuarioId), r.listarProveedores(), r.listarPedidos({ compradorId: usuarioId, visorId: usuarioId }), r.favoritos(usuarioId)]);
        return { yo, sols, provs, favoritos, pedidos: pedidos.map((p) => ({ p, n: p.ofertas })) };
    }, [usuarioId]);
    if (!data)
        return _jsx("div", { className: "envoltura pagina" });
    const { yo, sols, provs, pedidos, favoritos } = data;
    const prov = (id) => provs.find((p) => p.id === id);
    const pendientes = sols.filter((s) => s.estado === 'pendiente');
    const postergadas = sols.filter((s) => s.estado === 'postergada');
    const aceptadas = sols.filter((s) => s.estado === 'aceptada');
    const contactados = new Set(sols.map((s) => s.proveedorId));
    const sugeridos = provs.filter((p) => !contactados.has(p.id) && p.rubros.some((r) => yo.rubros.includes(r))).slice(0, 3);
    return (_jsxs("div", { className: "envoltura pagina panel", children: [_jsxs("header", { className: "panel__cab", children: [_jsxs("div", { children: [_jsxs("p", { className: "eyebrow", children: ["Panel de comprador \u00B7 ", yo.empresa] }), _jsxs("h1", { children: ["Hola, ", yo.nombre] })] }), _jsx(Link, { to: "/cotizaciones/nuevo", className: "btn btn--pri btn--grande", children: "Nuevo pedido de cotizaci\u00F3n" })] }), _jsx(PrimerosPasos, { usuarioId: usuarioId, pasos: [
                    { hecho: !!yo.logo, texto: 'Subí el logo de tu empresa: los proveedores confían más en un perfil completo.', a: '/perfil', accion: 'Ir a mi perfil' },
                    { hecho: pedidos.length > 0, texto: 'Publicá tu primer pedido de cotización.', a: '/cotizaciones/nuevo', accion: 'Publicar' },
                    { hecho: favoritos.length > 0, texto: 'Guardá como favorito un proveedor del directorio para invitarlo a tus pedidos.', a: '/red', accion: 'Ver proveedores' },
                ] }), _jsxs("div", { className: "panel__grilla", children: [_jsxs("div", { className: "panel__col", children: [_jsxs(Seccion, { titulo: "Tus pedidos de cotizaci\u00F3n", extra: _jsx(Link, { to: "/cotizaciones", className: "enlace", children: "Ver todos" }), children: [pedidos.length === 0 && _jsx(Vacio, { titulo: "Todav\u00EDa no publicaste pedidos", accion: { a: '/cotizaciones/nuevo', texto: 'Publicar el primero' }, children: "Cont\u00E1 qu\u00E9 necesit\u00E1s y recib\u00ED ofertas comparables \u00EDtem por \u00EDtem." }), [...pedidos].sort((a, b) => orden(a.p) - orden(b.p) || a.p.cierraEn.localeCompare(b.p.cierraEn)).map(({ p, n }) => (_jsxs(Link, { to: `/cotizaciones/${p.id}`, className: "fila-pedido", children: [_jsx("span", { className: "mono tenue", children: p.id }), _jsx("span", { children: p.titulo }), _jsx(EstadoPedido, { p: p, n: n })] }, p.id)))] }), _jsxs(Seccion, { titulo: `Solicitudes de contacto · ${pendientes.length} por responder`, children: [pendientes.length === 0 && _jsx(Vacio, { titulo: "No ten\u00E9s solicitudes pendientes", children: "Las nuevas llegan en tu resumen del lunes." }), pendientes.map((s) => _jsx(Solicitud, { s: s, p: prov(s.proveedorId) }, s.id)), pendientes.length > 0 && _jsx("p", { className: "nota", children: "Si eleg\u00EDs \u201CNo me interesa\u201D, el proveedor solo ve que la solicitud se cerr\u00F3." })] }), postergadas.length > 0 && (_jsx(Seccion, { titulo: "Para m\u00E1s adelante", children: postergadas.map((s) => _jsx(Solicitud, { s: s, p: prov(s.proveedorId) }, s.id)) }))] }), _jsxs("div", { className: "panel__col", children: [_jsxs(Seccion, { titulo: "Canal directo", children: [aceptadas.length === 0 && _jsx("p", { className: "tenue", children: "Cuando aceptes una solicitud, ac\u00E1 vas a tener el mail y el tel\u00E9fono." }), aceptadas.map((s) => {
                                        const p = prov(s.proveedorId);
                                        return (_jsxs("div", { className: "contacto", children: [_jsxs("div", { className: "contacto__cab", children: [_jsx(Avatar, { p: p }), _jsxs("div", { children: [_jsx(Link, { to: `/red/${p.id}`, children: _jsxs("strong", { children: [p.nombre, " ", p.apellido] }) }), _jsx("span", { className: "tenue bloque-linea", children: p.empresa })] })] }), _jsx(ContactoPersona, { p: p })] }, s.id));
                                    })] }), _jsx(Seccion, { titulo: "Proveedores sugeridos para tus rubros", children: _jsx("div", { className: "pila", children: sugeridos.map((p) => _jsx(TarjetaProveedor, { p: p }, p.id)) }) })] })] })] }));
}
/** Lo que hay que mirar primero: cerrados sin adjudicar, después abiertos, al final adjudicados. */
function orden(p) { return p.estado === 'adjudicado' ? 2 : recibeOfertas(p) ? 1 : 0; }
function EstadoPedido({ p, n }) {
    const ofertas = `${n} ${n === 1 ? 'oferta' : 'ofertas'}`;
    if (p.estado === 'adjudicado')
        return _jsx(Pill, { tono: "ok", children: t.estado.adjudicado });
    if (!recibeOfertas(p))
        return _jsx(Pill, { tono: n ? 'senal' : 'neutro', children: n ? `Cerró · ${ofertas} para evaluar` : 'Cerró sin ofertas' });
    const dias = fmt.diasHasta(p.cierre);
    return _jsxs(Pill, { tono: n ? 'sello' : 'neutro', children: [dias <= 0 ? 'Cierra hoy' : `Cierra en ${dias} ${dias === 1 ? 'día' : 'días'}`, " \u00B7 ", ofertas] });
}
function Solicitud({ s, p }) {
    const responderSolicitud = useResponderSolicitud();
    const avisar = useToast();
    const responder = async (estado) => {
        await responderSolicitud(s, estado);
        if (estado === 'aceptada')
            avisar(`Aceptaste a ${p.nombre} ${p.apellido}. Ya tienen canal directo.`);
        if (estado === 'postergada')
            avisar('La guardamos para más adelante.', 'info');
        if (estado === 'rechazada')
            avisar('Listo. El proveedor no ve que la rechazaste.', 'info');
    };
    return (_jsxs("article", { className: "solicitud", children: [_jsxs("div", { className: "solicitud__cab", children: [_jsx(Avatar, { p: p }), _jsxs("div", { children: [_jsx(Link, { to: `/red/${p.id}`, children: _jsxs("strong", { children: [p.nombre, " ", p.apellido] }) }), _jsxs("span", { className: "tenue bloque-linea", children: [p.cargo, " \u00B7 ", p.empresa] })] }), _jsx("span", { className: "tenue mono", children: fmt.fecha(s.creada) })] }), _jsx("blockquote", { className: "motivo", children: s.motivo }), _jsxs("div", { className: "acciones-sol", children: [_jsx("button", { className: "btn btn--pri btn--chico", onClick: () => responder('aceptada'), children: t.acciones.aceptar }), s.estado !== 'postergada' && _jsx("button", { className: "btn btn--sec btn--chico", onClick: () => responder('postergada'), children: t.acciones.postergar }), _jsx("button", { className: "btn btn--ter btn--chico", onClick: () => responder('rechazada'), children: t.acciones.rechazar })] })] }));
}
