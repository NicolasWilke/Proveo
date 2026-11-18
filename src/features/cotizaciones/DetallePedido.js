import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { monedaDe } from '@/domain/moneda';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useSesion } from '@/app/session';
import { useQuery, useRepo } from '@/data/DataProvider';
import { rubro } from '@/domain/catalogos';
import { adjudicadosDe, ahorro, cerrado, horaDeCierre, preciosVisibles, puedeCotizar, recibeOfertas, sugerirAdjudicacion, totales, } from '@/domain/rfq';
import { fmt, t } from '@/i18n';
import { Pill, Seccion, Vacio } from '@/ui/primitivas';
import { useToast } from '@/ui/Toast';
import { Consultas } from './Consultas';
import { ListaEnlaces } from './Enlaces';
import { Matriz } from './Matriz';
import { matrizCsv, nombreArchivo } from '@/domain/exportar';
import { descargar } from '@/ui/descargar';
import { CotizarModal } from './modales';
import { Resenar } from './Resenar';
import { VENTANA_DIAS } from '@/domain/antecedentes';
const cuando = (p) => `${fmt.fecha(p.cierre)} a las ${horaDeCierre(p.cierraEn)}`;
export function DetallePedido() {
    const { id = '' } = useParams();
    const { rol, usuarioId } = useSesion();
    const [cotizando, setCotizando] = useState(false);
    // Desde el panel se llega con ?cotizar=1: si todavía se puede cotizar, el formulario se abre solo.
    const [params, setParams] = useSearchParams();
    const quiereCotizar = params.get('cotizar') === '1';
    const { data, cargando } = useQuery(async (r) => {
        const pedido = await r.obtenerPedido(id);
        if (!pedido)
            return null;
        const [cotis, provs, comprador] = await Promise.all([r.cotizacionesDe(id), r.listarProveedores(), r.obtenerPersona(pedido.compradorId)]);
        const esDueno = pedido.compradorId === usuarioId;
        const [avisos, resenas] = await Promise.all([
            esDueno ? r.avisosDePedido(id) : [],
            pedido.estado === 'adjudicado' && esDueno ? r.resenasDePedido(id) : [],
        ]);
        return { pedido, cotis, provs, comprador, avisos, resenas };
    }, [id, usuarioId]);
    const listoParaCotizar = !!data && rol === 'proveedor' && recibeOfertas(data.pedido) && !data.cotis.some((c) => c.proveedorId === usuarioId);
    useEffect(() => {
        if (!quiereCotizar || cargando)
            return;
        if (listoParaCotizar)
            setCotizando(true);
        setParams({}, { replace: true });
    }, [quiereCotizar, cargando, listoParaCotizar, setParams]);
    if (cargando)
        return _jsx("div", { className: "envoltura pagina" });
    if (!data)
        return _jsx("div", { className: "envoltura pagina", children: _jsx(Vacio, { titulo: "Este pedido no existe o es privado", accion: { a: '/cotizaciones', texto: 'Ver pedidos' } }) });
    const { pedido, cotis, provs, comprador, avisos, resenas } = data;
    const esDueno = rol === 'comprador' && pedido.compradorId === usuarioId;
    const mia = cotis.find((c) => c.proveedorId === usuarioId);
    const abierto = recibeOfertas(pedido);
    const prov = (pid) => provs.find((p) => p.id === pid);
    return (_jsxs("div", { className: "envoltura pagina", children: [_jsx(Link, { to: "/cotizaciones", className: "enlace", children: "\u2190 Pedidos" }), _jsxs("header", { className: "pedido", children: [_jsxs("div", { children: [_jsxs("p", { className: "eyebrow", children: [_jsx("span", { className: "mono", children: pedido.id }), " \u00B7 ", rubro(pedido.rubro).nombre, pedido.privado && ' · Privado'] }), _jsx("h1", { children: pedido.titulo }), comprador && comprador.rol === 'comprador' && (_jsxs("p", { children: ["Publicado por ", _jsx(Link, { to: `/red/${comprador.id}`, children: comprador.semiAnonimo && !esDueno ? `${comprador.cargo} de ${comprador.empresa}` : `${comprador.nombre} ${comprador.apellido}, ${comprador.empresa}` })] }))] }), _jsxs("div", { children: [pedido.estado === 'adjudicado' ? _jsx(Pill, { tono: "ok", children: t.estado.adjudicado })
                                : abierto ? _jsxs(Pill, { tono: "senal", children: ["Recibe ofertas hasta el ", cuando(pedido)] })
                                    : _jsx(Pill, { tono: "sello", children: "Cerrado \u00B7 en evaluaci\u00F3n" }), esDueno && _jsx("p", { children: _jsx(Link, { to: `/cotizaciones/nuevo?repetir=${pedido.id}`, className: "enlace", children: "Repetir este pedido" }) })] })] }), pedido.descripcion && _jsx("p", { className: "pedido__desc", children: pedido.descripcion }), _jsxs("dl", { className: "ficha-tecnica", children: [_jsxs("div", { children: [_jsx("dt", { children: "Entrega" }), _jsx("dd", { children: pedido.entrega })] }), _jsxs("div", { children: [_jsx("dt", { children: "Pago" }), _jsx("dd", { children: pedido.pago })] }), pedido.zona && _jsxs("div", { children: [_jsx("dt", { children: "Zona" }), _jsx("dd", { children: pedido.zona })] }), _jsxs("div", { children: [_jsx("dt", { children: "Cierre" }), _jsx("dd", { children: cuando(pedido) })] }), _jsxs("div", { children: [_jsx("dt", { children: "Precios" }), _jsx("dd", { children: pedido.sobreCerrado ? 'Sobre cerrado: se abren al cierre' : 'Visibles al llegar' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Ofertas recibidas" }), _jsx("dd", { className: "mono", children: pedido.ofertas })] })] }), _jsxs(Seccion, { titulo: `Ítems · ${pedido.items.length}`, children: [_jsx("div", { className: "tabla-envoltura", children: _jsxs("table", { className: "tabla tabla--items", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "#" }), _jsx("th", { children: "\u00CDtem" }), _jsx("th", { children: "Descripci\u00F3n t\u00E9cnica" }), _jsx("th", { className: "num", children: "Cantidad" })] }) }), _jsx("tbody", { children: pedido.items.map((i, n) => (_jsxs("tr", { children: [_jsx("td", { className: "mono tenue", children: n + 1 }), _jsx("td", { className: "tabla__tit", children: i.nombre }), _jsx("td", { children: i.descripcion || _jsx("span", { className: "tenue", children: "\u2014" }) }), _jsxs("td", { className: "num mono", children: [fmt.numero(i.cantidad), " ", _jsx("span", { className: "tenue", children: i.unidad })] })] }, i.id))) })] }) }), (pedido.documentos.length > 0 || pedido.adjuntos.length > 0) && (_jsxs("div", { className: "pedido__docs", children: [pedido.documentos.length > 0 && _jsxs("div", { children: [_jsx("p", { className: "etq", children: "Documentos que hay que presentar" }), _jsx("ul", { children: pedido.documentos.map((d) => _jsx("li", { children: d }, d)) })] }), pedido.adjuntos.length > 0 && _jsxs("div", { children: [_jsx("p", { className: "etq", children: "Archivos del comprador" }), _jsx(ListaEnlaces, { enlaces: pedido.adjuntos })] })] }))] }), _jsx(Consultas, { pedido: pedido, rol: rol, usuarioId: usuarioId, esDueno: esDueno }), rol === 'proveedor' && (_jsx(VistaProveedor, { pedido: pedido, mia: mia, provs: provs, usuarioId: usuarioId, abierto: abierto, onCotizar: () => setCotizando(true) })), rol === 'comprador' && !esDueno && (_jsx("p", { className: "nota", children: "Este pedido es de otro comprador. Solo quien lo public\u00F3 ve las ofertas." })), esDueno && _jsx(VistaComprador, { pedido: pedido, cotis: cotis, provs: provs }), esDueno && pedido.estado === 'adjudicado' && (pedido.adjudicados ?? []).map((pid) => (_jsx(Resenar, { pedidoId: pedido.id, proveedorId: pid, empresa: prov(pid)?.empresa ?? 'el proveedor', resena: resenas.find((r) => r.proveedorId === pid || (!r.proveedorId && pid === pedido.adjudicadaA)) ?? null }, pid))), esDueno && (_jsxs(Seccion, { titulo: `${pedido.privado ? 'Invitaciones' : 'Aviso a proveedores'} · ${avisos.length}`, extra: _jsx(Link, { to: "/mails", className: "enlace", children: "Ver los mails" }), children: [avisos.length === 0 && _jsx("p", { className: "tenue", children: "Los avisos de este pedido salieron antes de que existiera el registro. En los pedidos nuevos vas a ver ac\u00E1 a qui\u00E9n le lleg\u00F3." }), avisos.length > 0 && (_jsx("ul", { className: "avisos", children: avisos.map((a) => (_jsxs("li", { children: [_jsx(Link, { to: `/red/${a.proveedorId}`, children: a.empresa }), _jsx(Pill, { tono: a.via === 'mail' ? 'ok' : 'neutro', children: a.via === 'mail' ? 'Mail enviado' : 'En su resumen diario' })] }, a.proveedorId))) })), _jsx("p", { className: "nota", children: "El mail muestra tu nombre, cargo y empresa como en tu perfil. Tu mail y tu tel\u00E9fono no se comparten hasta que acept\u00E1s una solicitud o eleg\u00EDs una cotizaci\u00F3n." })] })), cotizando && _jsx(CotizarModal, { pedido: pedido, proveedorId: usuarioId, onCerrar: () => setCotizando(false) })] }));
}
function VistaProveedor({ pedido, mia, provs, usuarioId, abierto, onCotizar }) {
    const invitado = puedeCotizar(pedido, usuarioId);
    const gane = pedido.adjudicacion ? Object.entries(pedido.adjudicacion).filter(([, p]) => p === usuarioId).map(([i]) => i) : [];
    return (_jsxs(_Fragment, { children: [!mia && abierto && invitado && (_jsxs("div", { className: "llamado", children: [_jsxs("p", { children: ["Cotiz\u00E1 cada \u00EDtem en el formato del pedido.", pedido.sobreCerrado ? ' Es sobre cerrado: nadie ve tu precio antes del cierre.' : '', " Las ofertas de otros proveedores nunca se muestran."] }), _jsx("button", { className: "btn btn--pri", onClick: onCotizar, children: t.acciones.cotizar })] })), !mia && !invitado && _jsx("p", { className: "nota", children: "Este pedido es privado: solo cotizan los proveedores invitados." }), !mia && invitado && !abierto && _jsxs("p", { className: "nota", children: ["Este pedido cerr\u00F3 el ", cuando(pedido), " y ya no recibe ofertas."] }), mia && (_jsxs(Seccion, { titulo: "Tu oferta", extra: pedido.estado === 'adjudicado' && (gane.length
                    ? _jsx(Pill, { tono: "ok", children: gane.length === pedido.items.length ? 'Ganaste el pedido' : `Ganaste ${gane.length} de ${pedido.items.length} ítems` })
                    : _jsx(Pill, { children: "Adjudicado a otra propuesta" })), children: [_jsx("p", { className: "tenue", children: "Las ofertas de otros proveedores no se muestran. Tu oferta ya no se puede editar." }), _jsx(Matriz, { pedido: pedido, cotis: [mia], provs: provs, asignacion: pedido.adjudicacion })] }))] }));
}
function VistaComprador({ pedido, cotis, provs }) {
    const repo = useRepo();
    const avisar = useToast();
    const visibles = preciosVisibles(pedido);
    const [asignacion, setAsignacion] = useState({});
    const [comentario, setComentario] = useState('');
    const [listar, setListar] = useState(true);
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);
    const prov = (pid) => provs.find((p) => p.id === pid);
    if (!visibles) {
        return (_jsx(Seccion, { titulo: `Ofertas · ${pedido.ofertas} recibidas`, children: _jsxs("div", { className: "sobre", children: [_jsxs("p", { className: "sobre__tit", children: ["Sobre cerrado hasta el ", cuando(pedido)] }), _jsxs("p", { className: "tenue", children: [pedido.ofertas === 0 ? 'Todavía no llegaron ofertas.' : pedido.ofertas === 1 ? 'Llegó 1 oferta.' : `Llegaron ${pedido.ofertas} ofertas.`, " Los precios se abren solos al cierre; hasta entonces nadie los ve, ni vos."] })] }) }));
    }
    if (!cotis.length) {
        return _jsx(Seccion, { titulo: "Ofertas", children: _jsx(Vacio, { titulo: "No llegaron ofertas", children: cerrado(pedido) ? 'El pedido cerró sin ofertas. Podés publicarlo de nuevo con más plazo o como privado, invitando proveedores.' : 'Los proveedores del rubro ya recibieron el pedido.' }) });
    }
    if (pedido.estado === 'adjudicado') {
        const asig = pedido.adjudicacion ?? {};
        const a = ahorro(pedido, cotis, asig);
        return (_jsxs(Seccion, { titulo: `Comparador · ${cotis.length} ${cotis.length === 1 ? 'oferta' : 'ofertas'}`, extra: _jsx(AccionesComparador, { pedido: pedido, cotis: cotis, provs: provs }), children: [_jsxs("div", { className: "adjudicacion", children: [(pedido.adjudicados ?? []).map((pid) => {
                            const items = pedido.items.filter((i) => asig[i.id] === pid);
                            const c = cotis.find((x) => x.proveedorId === pid);
                            return (_jsxs("p", { children: [_jsx(Pill, { tono: "ok", children: "Adjudicado" }), " ", _jsx(Link, { to: `/red/${pid}`, children: prov(pid)?.empresa ?? pid }), ": ", items.length === pedido.items.length ? 'todo el pedido' : items.map((i) => i.nombre).join(', '), c && _jsxs("span", { className: "mono", children: [" \u00B7 ", fmt.importe(totales(pedido, c, items.map((i) => i.id)).total, monedaDe(pedido))] })] }, pid));
                        }), _jsxs("p", { className: "tenue", children: ["Adjudicado en total: ", _jsx("strong", { className: "mono", children: fmt.importe(a.adjudicado, monedaDe(pedido)) }), a.monto > 0 && _jsxs(_Fragment, { children: [" \u00B7 Ahorro contra la oferta m\u00E1s alta: ", _jsx("strong", { className: "mono", children: fmt.importe(a.monto, monedaDe(pedido)) }), " (", fmt.pct(a.pct, false), ")"] })] }), pedido.comentarioAdjudicacion && _jsxs("p", { children: [_jsx("span", { className: "etq", children: "Justificaci\u00F3n" }), " ", pedido.comentarioAdjudicacion] })] }), _jsx(Matriz, { pedido: pedido, cotis: cotis, provs: provs, asignacion: asig })] }));
    }
    const completa = pedido.items.every((i) => asignacion[i.id]);
    const resumen = completa ? ahorro(pedido, cotis, asignacion) : null;
    const ganadores = adjudicadosDe(asignacion);
    const adjudicar = async () => {
        setError('');
        setEnviando(true);
        try {
            await repo.adjudicar(pedido.id, asignacion, comentario, listar);
            avisar(ganadores.length === 1
                ? `Adjudicado a ${(prov(ganadores[0])?.empresa ?? '').replace(/\.$/, '')}. Cuando termine la entrega, calificalo desde este pedido.`
                : `Adjudicado entre ${ganadores.length} proveedores. Cuando terminen las entregas, calificalos desde este pedido.`);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo adjudicar.');
        }
        finally {
            setEnviando(false);
        }
    };
    return (_jsxs(Seccion, { titulo: `Comparador · ${cotis.length} ${cotis.length === 1 ? 'oferta' : 'ofertas'}`, extra: _jsx(AccionesComparador, { pedido: pedido, cotis: cotis, provs: provs }), children: [pedido.estado === 'abierto' && !cerrado(pedido) && _jsxs("p", { className: "tenue", children: ["El pedido sigue abierto hasta el ", cuando(pedido), ": pueden llegar m\u00E1s ofertas."] }), _jsx(Matriz, { pedido: pedido, cotis: cotis, provs: provs, asignacion: asignacion, onAsignar: (itemId, pid) => setAsignacion({ ...asignacion, [itemId]: pid }) }), _jsxs("div", { className: "adjudicar", children: [_jsxs("div", { className: "adjudicar__atajos", children: [_jsx("span", { className: "etq", children: "Adjudicar" }), _jsx("button", { type: "button", className: "btn btn--sec btn--chico", onClick: () => setAsignacion(sugerirAdjudicacion(pedido, cotis, 'total')), children: "Todo al total m\u00E1s bajo" }), pedido.items.length > 1 && _jsx("button", { type: "button", className: "btn btn--sec btn--chico", onClick: () => setAsignacion(sugerirAdjudicacion(pedido, cotis, 'item')), children: "Cada \u00EDtem al menor precio" }), Object.keys(asignacion).length > 0 && _jsx("button", { type: "button", className: "btn btn--ter btn--chico", onClick: () => setAsignacion({}), children: "Limpiar" })] }), _jsx("p", { className: "tenue", children: completa
                            ? `${ganadores.length === 1 ? `Todo a ${prov(ganadores[0])?.empresa}` : `Repartido entre ${ganadores.length} proveedores`}: ${fmt.importe(resumen.adjudicado, monedaDe(pedido))} con IVA${resumen.monto > 0 ? `, ${fmt.importe(resumen.monto, monedaDe(pedido))} menos que la oferta más alta` : ''}.`
                            : `Elegí una oferta por ítem en el cuadro (${Object.keys(asignacion).length} de ${pedido.items.length}) o usá un atajo.` }), _jsxs("label", { className: "campo", htmlFor: "adj-comentario", children: [_jsx("span", { children: "Justificaci\u00F3n de la decisi\u00F3n (opcional, sale en el resumen ejecutivo)" }), _jsx("textarea", { id: "adj-comentario", rows: 2, maxLength: 1000, value: comentario, onChange: (e) => setComentario(e.target.value), placeholder: "Ej.: se prioriza el plazo de entrega para el film." })] }), _jsxs("label", { className: "opcion", children: [_jsx("input", { type: "checkbox", checked: listar, onChange: (e) => setListar(e.target.checked) }), _jsxs("span", { children: ["Listar en Compras recientes por ", VENTANA_DIAS, " d\u00EDas, sin precio ni el nombre de tu empresa. Otros compradores pueden pedirle valor al proveedor."] })] }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsx("div", { className: "form__acciones", children: _jsx("button", { className: "btn btn--pri", disabled: !completa || enviando, onClick: adjudicar, children: enviando ? 'Adjudicando…' : 'Adjudicar' }) })] })] }));
}
function AccionesComparador({ pedido, cotis, provs }) {
    const empresa = (pid) => provs.find((p) => p.id === pid)?.empresa ?? pid;
    return (_jsxs("span", { className: "acciones-fila", children: [_jsx("button", { className: "btn btn--sec btn--chico", onClick: () => descargar(nombreArchivo(`matriz ${pedido.id} ${pedido.titulo}`), matrizCsv(pedido, cotis, empresa)), children: "Descargar Excel" }), _jsx(Link, { to: `/cotizaciones/${pedido.id}/resumen`, className: "btn btn--sec btn--chico", children: "Resumen ejecutivo" })] }));
}
