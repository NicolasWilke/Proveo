import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, useSearchParams } from 'react-router-dom';
import { useSesion } from '@/app/session';
import { useQuery } from '@/data/DataProvider';
import { rubro } from '@/domain/catalogos';
import { horaDeCierre, recibeOfertas } from '@/domain/rfq';
import { ESTADOS_FILTRO, filtrarPedidos, hayFiltros } from '@/domain/pedidosProveedor';
import { FiltroRubro } from '@/ui/rubros';
import { fmt, t } from '@/i18n';
import { Pill, Vacio } from '@/ui/primitivas';
import { historialCsv } from '@/domain/exportar';
import { descargar } from '@/ui/descargar';
export function Cotizaciones() {
    const { rol, usuarioId } = useSesion();
    const { data } = useQuery(async (r) => {
        const yo = (await r.obtenerPersona(usuarioId));
        const pedidos = await r.listarPedidos(rol === 'comprador' ? { compradorId: usuarioId, visorId: usuarioId } : { visorId: usuarioId });
        // El proveedor ve todos los pedidos públicos de la red (de cualquier rubro) y sus invitaciones;
        // filtrar por sus rubros es opcional. Necesita saber en cuáles ya cotizó; el comprador ve el contador del pedido.
        const mias = rol === 'proveedor' ? await Promise.all(pedidos.map((p) => r.cotizacionesDe(p.id))) : [];
        const compradores = await r.listarCompradores();
        // Para el historial: solo los adjudicados, que ya tienen los precios abiertos.
        const adjudicados = rol === 'comprador' ? pedidos.filter((p) => p.estado === 'adjudicado') : [];
        const [provs, cotisAdj] = adjudicados.length
            ? await Promise.all([r.listarProveedores(), Promise.all(adjudicados.map((p) => r.cotizacionesDe(p.id)))])
            : [[], []];
        return {
            yo,
            provs,
            cotis: Object.fromEntries(adjudicados.map((p, i) => [p.id, cotisAdj[i]])),
            pedidos: pedidos.map((p, i) => ({ p, yaCotice: !!mias[i]?.some((c) => c.proveedorId === usuarioId), comprador: compradores.find((c) => c.id === p.compradorId) })),
        };
    }, [rol, usuarioId]);
    // Filtros del proveedor, en la URL para que sobrevivan al volver de un pedido. Sin filtros: todo.
    const [params, setParams] = useSearchParams();
    const filtro = {
        estado: (params.get('ver') ?? 'todos'),
        rubro: (params.get('rubro') || undefined),
        soloMios: params.get('mios') === '1',
        texto: params.get('q') ?? '',
    };
    const cambiar = (c) => {
        const n = { ...filtro, ...c };
        const q = {};
        if (n.estado && n.estado !== 'todos')
            q.ver = n.estado;
        if (n.rubro)
            q.rubro = n.rubro;
        if (n.soloMios)
            q.mios = '1';
        if (n.texto)
            q.q = n.texto;
        setParams(q, { replace: true });
    };
    const esProv = rol === 'proveedor';
    const res = data && esProv ? filtrarPedidos(data.pedidos, filtro, data.yo.rubros, usuarioId) : null;
    const visibles = res ? res.visibles : data?.pedidos ?? [];
    return (_jsxs("div", { className: "envoltura pagina", children: [_jsxs("header", { className: "pagina__cab pagina__cab--fila", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Pedidos de cotizaci\u00F3n" }), _jsx("h1", { children: rol === 'comprador' ? 'Tus pedidos y las ofertas que recibiste' : 'Todos los pedidos de la red' })] }), rol === 'comprador' && (_jsxs("div", { className: "acciones-fila", children: [data && visibles.length > 0 && (_jsx("button", { className: "btn btn--sec", onClick: () => descargar('historial-de-pedidos.csv', historialCsv(data.pedidos.map((x) => x.p), data.cotis, (pid) => data.provs.find((p) => p.id === pid)?.empresa ?? pid, (id) => rubro(id).nombre)), children: "Descargar historial en Excel" })), _jsx(Link, { className: "btn btn--pri", to: "/cotizaciones/nuevo", children: "Publicar pedido" })] }))] }), res && data.pedidos.length > 0 && (_jsxs("div", { className: "filtros-pedidos", children: [_jsxs("div", { className: "filtros", children: [_jsxs("label", { className: "campo campo--inline", htmlFor: "ped-buscar", children: [_jsx("span", { children: "Buscar" }), _jsx("input", { id: "ped-buscar", type: "search", placeholder: "T\u00EDtulo, zona o \u00EDtem", value: filtro.texto, onChange: (e) => cambiar({ texto: e.target.value }) })] }), _jsxs("label", { className: "opcion opcion--inline", children: [_jsx("input", { type: "checkbox", checked: !!filtro.soloMios, onChange: (e) => cambiar({ soloMios: e.target.checked }) }), _jsx("span", { children: "Solo mis rubros e invitaciones" })] }), hayFiltros(filtro) && _jsx("button", { type: "button", className: "btn btn--ter btn--chico", onClick: () => setParams({}, { replace: true }), children: "Quitar filtros" })] }), _jsx("div", { className: "segmento segmento--apilable", role: "group", "aria-label": "Estado del pedido", children: ESTADOS_FILTRO.map(([k, txt]) => (_jsxs("button", { type: "button", "aria-pressed": filtro.estado === k, className: filtro.estado === k ? 'is-activo' : '', onClick: () => cambiar({ estado: k }), children: [txt, " ", _jsx("span", { className: "mono tenue", children: res.conteo[k] })] }, k))) }), _jsx(FiltroRubro, { id: "ped-rubro", valor: filtro.rubro, onCambio: (r) => cambiar({ rubro: r }), conDatos: data.pedidos.map((x) => x.p.rubro) })] })), res && visibles.length === 0 && data.pedidos.length > 0 && (_jsx(Vacio, { titulo: "No hay pedidos con esos filtros", children: "Prob\u00E1 con otro estado, otro rubro o quit\u00E1 los filtros para ver todos." })), data && data.pedidos.length === 0 && (_jsx(Vacio, { titulo: rol === 'comprador' ? 'Todavía no publicaste pedidos' : 'Todavía no hay pedidos publicados en la red', children: rol === 'comprador' ? 'Publicá una necesidad y recibí ofertas comparables ítem por ítem.' : 'Te avisamos por mail cuando aparezca uno de tus rubros o cuando un comprador te invite.' })), data && visibles.length > 0 && (_jsx("div", { className: "tabla-envoltura", children: _jsxs("table", { className: "tabla", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Pedido" }), _jsx("th", { children: "Rubro" }), _jsx("th", { className: "num", children: "Cantidad" }), _jsx("th", { children: "Cierra" }), _jsx("th", { children: rol === 'comprador' ? 'Ofertas' : 'Comprador' }), _jsx("th", { children: "Estado" })] }) }), _jsx("tbody", { children: visibles.map(({ p, yaCotice, comprador }) => (_jsx(Fila, { p: p, rol: rol, yaCotice: yaCotice, gane: !!p.adjudicados?.includes(usuarioId), comprador: !comprador ? '' : comprador.semiAnonimo ? `${comprador.cargo} · ${comprador.empresa}` : `${comprador.nombre} ${comprador.apellido} · ${comprador.empresa}` }, p.id))) })] }) }))] }));
}
function Fila({ p, rol, comprador, yaCotice, gane }) {
    const dias = fmt.diasHasta(p.cierre);
    const abierto = recibeOfertas(p);
    return (_jsxs("tr", { children: [_jsxs("td", { children: [_jsxs(Link, { to: `/cotizaciones/${p.id}`, className: "tabla__tit", children: [_jsx("span", { className: "mono tenue", children: p.id }), " ", p.titulo] }), p.privado && _jsxs(_Fragment, { children: [" ", _jsx(Pill, { tono: "sello", children: rol === 'proveedor' ? 'Invitación' : 'Privado' })] })] }), _jsx("td", { children: rubro(p.rubro).nombre }), _jsx("td", { className: "num mono", children: p.items.length > 1 ? `${p.items.length} ítems` : _jsxs(_Fragment, { children: [fmt.numero(p.cantidad), " ", _jsx("span", { className: "tenue", children: p.unidad })] }) }), _jsxs("td", { children: [fmt.fecha(p.cierre), " ", _jsx("span", { className: "tenue mono", children: horaDeCierre(p.cierraEn) }), " ", abierto && dias >= 0 && dias <= 7 && _jsx(Pill, { tono: "senal", children: dias === 0 ? 'hoy' : `${dias} d` })] }), _jsx("td", { children: rol === 'comprador' ? _jsx("span", { className: "mono", children: p.ofertas }) : comprador }), _jsx("td", { children: p.estado === 'adjudicado' && rol === 'proveedor' && yaCotice ? (gane ? _jsx(Pill, { tono: "ok", children: "Ganaste" }) : _jsx(Pill, { children: "No ganado" }))
                    : p.estado === 'adjudicado' ? _jsx(Pill, { tono: "ok", children: t.estado.adjudicado })
                        : rol === 'proveedor' && yaCotice ? _jsx(Pill, { tono: "sello", children: abierto ? 'Cotizaste' : 'Cotizaste · en evaluación' })
                            : rol === 'proveedor' && abierto ? _jsx(Link, { to: `/cotizaciones/${p.id}?cotizar=1`, className: "btn btn--pri btn--chico", children: "Cotizar" })
                                : abierto ? _jsx(Pill, { children: t.estado.abierto })
                                    : _jsx(Pill, { tono: "senal", children: "En evaluaci\u00F3n" }) })] }));
}
