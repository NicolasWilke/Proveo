import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { monedaDe } from '@/domain/moneda';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSesion } from '@/app/session';
import { useQuery } from '@/data/DataProvider';
import { rubro } from '@/domain/catalogos';
import { ahorro, horaDeCierre, matriz, preciosVisibles, totales } from '@/domain/rfq';
import { fmt } from '@/i18n';
import { Vacio } from '@/ui/primitivas';
import { matrizCsv, nombreArchivo } from '@/domain/exportar';
import { descargar } from '@/ui/descargar';
import { MARCA } from '@/config/marca';
const hoy = () => new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
/**
 * Resumen ejecutivo de un pedido, en 4 secciones fijas, listo para imprimir o guardar como PDF
 * desde el navegador. Solo lo ve el comprador, y solo cuando los precios ya se abrieron.
 */
export function ResumenEjecutivo() {
    const { id = '' } = useParams();
    const { usuarioId } = useSesion();
    const [soloFinalistas, setSoloFinalistas] = useState(false);
    const { data, cargando } = useQuery(async (r) => {
        const pedido = await r.obtenerPedido(id);
        if (!pedido || pedido.compradorId !== usuarioId)
            return null;
        const [cotis, provs, comprador, avisos] = await Promise.all([r.cotizacionesDe(id), r.listarProveedores(), r.obtenerPersona(usuarioId), r.avisosDePedido(id)]);
        return { pedido, cotis, provs, comprador: comprador, avisos };
    }, [id, usuarioId]);
    if (cargando)
        return _jsx("div", { className: "envoltura pagina" });
    if (!data)
        return _jsx("div", { className: "envoltura pagina", children: _jsx(Vacio, { titulo: "Solo quien public\u00F3 el pedido ve su resumen", accion: { a: '/cotizaciones', texto: 'Ver pedidos' } }) });
    const { pedido, cotis, provs, comprador, avisos } = data;
    if (!preciosVisibles(pedido)) {
        return _jsx("div", { className: "envoltura pagina", children: _jsxs(Vacio, { titulo: "El resumen est\u00E1 disponible despu\u00E9s del cierre", accion: { a: `/cotizaciones/${pedido.id}`, texto: 'Volver al pedido' }, children: ["Es sobre cerrado: los precios se abren el ", fmt.fecha(pedido.cierre), " a las ", horaDeCierre(pedido.cierraEn), "."] }) });
    }
    const asig = pedido.adjudicacion ?? {};
    const ganadores = pedido.adjudicados ?? [];
    const porTotal = [...cotis].sort((a, b) => totales(pedido, a).total - totales(pedido, b).total);
    const finalistas = [...new Set([...ganadores, ...porTotal.slice(0, 3).map((c) => c.proveedorId)])];
    const columnas = soloFinalistas ? porTotal.filter((c) => finalistas.includes(c.proveedorId)) : porTotal;
    const m = matriz(pedido, columnas);
    const a = ahorro(pedido, cotis, asig);
    const empresa = (pid) => provs.find((p) => p.id === pid)?.empresa ?? pid;
    const prov = (pid) => provs.find((p) => p.id === pid);
    const asunto = `Resumen ejecutivo ${pedido.id}: ${pedido.titulo}`;
    const cuerpo = [
        `Resumen ejecutivo del pedido ${pedido.id} (${pedido.titulo}).`, '',
        `Ofertas recibidas: ${cotis.length}.`,
        monedaDe(pedido) === 'USD' ? 'Montos en dólares estadounidenses.' : '',
        ganadores.length ? `Adjudicado a: ${ganadores.map(empresa).join(', ')}, por ${fmt.importe(a.adjudicado, monedaDe(pedido))} con IVA.` : 'Todavía sin adjudicar.',
        a.monto > 0 && ganadores.length ? `Ahorro contra la oferta más alta: ${fmt.importe(a.monto, monedaDe(pedido))} (${fmt.pct(a.pct, false)}).` : '',
        '', 'El detalle completo va en el PDF adjunto.',
    ].filter((x, i, xs) => x !== '' || xs[i - 1] !== '').join('\n');
    return (_jsxs("div", { className: "envoltura pagina resumen", children: [_jsxs("div", { className: "resumen__barra no-imprimir", children: [_jsx(Link, { to: `/cotizaciones/${pedido.id}`, className: "enlace", children: "\u2190 Volver al pedido" }), _jsxs("div", { className: "resumen__acciones", children: [_jsxs("label", { className: "opcion opcion--inline", children: [_jsx("input", { type: "checkbox", checked: soloFinalistas, onChange: (e) => setSoloFinalistas(e.target.checked) }), _jsx("span", { children: "Solo los 3 finalistas" })] }), _jsx("button", { className: "btn btn--sec btn--chico", onClick: () => window.print(), children: "Imprimir o guardar PDF" }), _jsx("button", { className: "btn btn--sec btn--chico", onClick: () => descargar(nombreArchivo(`matriz ${pedido.id} ${pedido.titulo}`), matrizCsv(pedido, columnas, empresa)), children: "Descargar Excel" }), _jsx("a", { className: "btn btn--pri btn--chico", href: `mailto:?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`, children: "Enviar por correo" })] }), _jsx("p", { className: "tenue resumen__ayuda", children: "Para mandarlo por correo, primero guardalo como PDF y despu\u00E9s adjuntalo al mail que se abre." })] }), _jsxs("article", { className: "hoja", children: [_jsxs("header", { className: "hoja__cab", children: [_jsxs("div", { children: [_jsx("p", { className: "etq", children: "Resumen ejecutivo" }), _jsx("h1", { children: pedido.titulo }), _jsxs("p", { className: "tenue", children: [rubro(pedido.rubro).nombre, pedido.descripcion ? ` · ${pedido.descripcion}` : ''] })] }), _jsxs("p", { className: "hoja__id mono", children: ["#", pedido.id] })] }), _jsxs("section", { className: "hoja__sec", children: [_jsx("h2", { children: "1. Informaci\u00F3n de control" }), _jsxs("dl", { className: "hoja__datos", children: [_jsxs("div", { children: [_jsx("dt", { children: "Comprador" }), _jsx("dd", { children: comprador.empresa })] }), _jsxs("div", { children: [_jsx("dt", { children: "Usuario" }), _jsxs("dd", { children: [comprador.nombre, " ", comprador.apellido, ", ", comprador.cargo] })] }), _jsxs("div", { children: [_jsx("dt", { children: "Cierre de ofertas" }), _jsxs("dd", { children: [fmt.fecha(pedido.cierre), " ", horaDeCierre(pedido.cierraEn)] })] }), _jsxs("div", { children: [_jsx("dt", { children: "Reporte generado" }), _jsx("dd", { children: hoy() })] }), _jsxs("div", { children: [_jsx("dt", { children: "Modalidad" }), _jsxs("dd", { children: [pedido.privado ? 'Privada, por invitación' : 'Pública', pedido.sobreCerrado ? ' · sobre cerrado' : ''] })] }), _jsxs("div", { children: [_jsx("dt", { children: "Entrega y pago pedidos" }), _jsxs("dd", { children: [pedido.entrega, " \u00B7 ", pedido.pago] })] })] })] }), _jsxs("section", { className: "hoja__sec", children: [_jsx("h2", { children: "2. Participaci\u00F3n" }), _jsxs("div", { className: "hoja__kpis", children: [_jsxs("div", { className: "kpi", children: [_jsx("span", { className: "kpi__k", children: pedido.privado ? 'Proveedores invitados' : 'Proveedores notificados' }), _jsx("span", { className: "kpi__v mono", children: pedido.privado ? pedido.invitados.length : avisos.length })] }), _jsxs("div", { className: "kpi", children: [_jsx("span", { className: "kpi__k", children: "Ofertas recibidas" }), _jsx("span", { className: "kpi__v mono", children: cotis.length })] }), _jsxs("div", { className: "kpi", children: [_jsx("span", { className: "kpi__k", children: "Ahorro estimado" }), _jsx("span", { className: "kpi__v mono", children: ganadores.length ? fmt.importe(a.monto, monedaDe(pedido)) : '—' }), _jsx("span", { className: "tenue", children: ganadores.length ? `${fmt.pct(a.pct, false)} contra la oferta más alta` : 'Se calcula al adjudicar' })] })] })] }), _jsxs("section", { className: "hoja__sec", children: [_jsxs("h2", { children: ["3. Matriz de comparaci\u00F3n", soloFinalistas && cotis.length > columnas.length ? ` · ${columnas.length} finalistas de ${cotis.length}` : ''] }), columnas.length === 0 ? _jsx("p", { className: "tenue", children: "No llegaron ofertas." }) : (_jsxs("table", { className: "hoja__tabla", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u00CDtem" }), _jsx("th", { className: "num", children: "Cantidad" }), columnas.map((c) => _jsx("th", { className: "num", children: empresa(c.proveedorId) }, c.id))] }) }), _jsx("tbody", { children: m.filas.map(({ item, celdas }) => (_jsxs("tr", { children: [_jsx("td", { children: item.nombre }), _jsxs("td", { className: "num", children: [fmt.numero(item.cantidad), " ", item.unidad] }), celdas.map((x, n) => (_jsx("td", { className: `num ${x?.mejor ? 'is-mejor' : ''} ${asig[item.id] === columnas[n].proveedorId ? 'is-elegida' : ''}`, children: x ? fmt.importe(x.unitarioNeto, monedaDe(pedido)) : '—' }, columnas[n].id)))] }, item.id))) }), _jsxs("tfoot", { children: [_jsxs("tr", { children: [_jsx("td", { colSpan: 2, children: "Neto" }), m.totales.map((t) => _jsx("td", { className: "num", children: fmt.importe(t.neto, monedaDe(pedido)) }, t.proveedorId))] }), _jsxs("tr", { children: [_jsx("td", { colSpan: 2, children: "IVA" }), m.totales.map((t) => _jsx("td", { className: "num", children: fmt.importe(t.iva, monedaDe(pedido)) }, t.proveedorId))] }), monedaDe(pedido) === 'USD' && _jsxs("tr", { children: [_jsx("td", { colSpan: 2, children: "Total en pesos (d\u00F3lar oficial BNA vendedor del d\u00EDa de cada oferta)" }), m.totales.map((t) => { const c = columnas.find((x) => x.proveedorId === t.proveedorId); return _jsx("td", { className: "num", children: c?.tipoCambio ? fmt.importe(t.total * c.tipoCambio.valor, 'ARS') : '—' }, t.proveedorId); })] }), _jsxs("tr", { className: "hoja__total", children: [_jsx("td", { colSpan: 2, children: "Total con IVA" }), m.totales.map((t) => _jsx("td", { className: `num ${m.totalMasBajo.includes(t.proveedorId) ? 'is-mejor' : ''}`, children: fmt.importe(t.total, monedaDe(pedido)) }, t.proveedorId))] }), _jsxs("tr", { children: [_jsx("td", { colSpan: 2, children: "Plazo de entrega" }), columnas.map((c) => _jsxs("td", { className: "num", children: [c.plazoDias, " d\u00EDas"] }, c.id))] })] })] })), _jsxs("p", { className: "hoja__nota", children: ["Precios unitarios netos de descuento, sin IVA. En verde, el menor precio de cada fila y el total m\u00E1s bajo", ganadores.length ? '; con borde, lo adjudicado' : '', "."] })] }), _jsxs("section", { className: "hoja__sec", children: [_jsx("h2", { children: "4. Adjudicaci\u00F3n y t\u00E9rminos comerciales" }), ganadores.length === 0 && _jsx("p", { className: "tenue", children: "El pedido todav\u00EDa no se adjudic\u00F3." }), ganadores.map((pid) => {
                                const c = cotis.find((x) => x.proveedorId === pid);
                                const items = pedido.items.filter((i) => asig[i.id] === pid);
                                const p = prov(pid);
                                return (_jsxs("dl", { className: "hoja__datos hoja__ganador", children: [_jsxs("div", { children: [_jsx("dt", { children: "Proveedor" }), _jsxs("dd", { children: [_jsx("strong", { children: empresa(pid) }), p ? ` · ${p.nombre} ${p.apellido}, ${p.cargo}` : ''] })] }), _jsxs("div", { children: [_jsx("dt", { children: "\u00CDtems" }), _jsx("dd", { children: items.length === pedido.items.length ? 'Todo el pedido' : items.map((i) => i.nombre).join(', ') })] }), c && _jsxs("div", { children: [_jsx("dt", { children: "Monto con IVA" }), _jsx("dd", { children: fmt.importe(totales(pedido, c, items.map((i) => i.id)).total, monedaDe(pedido)) })] }), c && _jsxs("div", { children: [_jsx("dt", { children: "Entrega" }), _jsxs("dd", { children: [c.plazoDias, " d\u00EDas"] })] }), c && _jsxs("div", { children: [_jsx("dt", { children: "Vigencia de la oferta" }), _jsx("dd", { children: c.vigencia ? fmt.fecha(c.vigencia) : '—' })] }), c && _jsxs("div", { children: [_jsx("dt", { children: "Pago" }), _jsx("dd", { children: c.pago })] })] }, pid));
                            }), pedido.comentarioAdjudicacion && _jsxs("div", { className: "hoja__comentario", children: [_jsx("p", { className: "etq", children: "Comentarios del comprador" }), _jsx("p", { children: pedido.comentarioAdjudicacion })] })] }), _jsxs("footer", { className: "hoja__pie", children: ["Generado con ", MARCA.nombre, " el ", hoy(), ". Los precios de proveedores no adjudicados son confidenciales: no compartas este reporte fuera de tu empresa."] })] })] }));
}
