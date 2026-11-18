import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { evento } from '@/app/medicion';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSesion } from '@/app/session';
import { useQuery, useRepo } from '@/data/DataProvider';
import { CONDICIONES_PAGO, rubro } from '@/domain/catalogos';
import { OpcionesRubro } from '@/ui/rubros';
import { DOCUMENTOS_SUGERIDOS, HORA_CIERRE, INVITADOS_MAX, ITEMS_MAX, cierreIso } from '@/domain/rfq';
import { ajustar, estimarTotal, factorInflacion, tieneValor, valorDelRubro } from '@/domain/valores';
import { fmt } from '@/i18n';
import { Seccion, Vacio } from '@/ui/primitivas';
import { useToast } from '@/ui/Toast';
import { RangoValor } from '../valores/RangoValor';
import { EditorEnlaces } from './Enlaces';
const filaNueva = (n, unidad) => ({ id: `i${n}`, nombre: '', descripcion: '', cantidad: '', unidad });
const manana = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);
/** Una semana es un plazo razonable para cotizar; el comprador lo cambia si quiere. */
const enUnaSemana = () => new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
/** Formulario completo del pedido: ítems, cierre con hora, privacidad, sobre cerrado, documentos y enlaces. */
export function NuevoPedido() {
    const { rol, usuarioId } = useSesion();
    const repo = useRepo();
    const ir = useNavigate();
    const avisar = useToast();
    const [r, setR] = useState('packaging');
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [items, setItems] = useState([filaNueva(1, rubro('packaging').unidad)]);
    const [proximo, setProximo] = useState(2);
    const [fecha, setFecha] = useState(enUnaSemana);
    const [hora, setHora] = useState(HORA_CIERRE);
    const [entrega, setEntrega] = useState('');
    const [pago, setPago] = useState('60 días fecha factura');
    const [zona, setZona] = useState(null);
    const [sobreCerrado, setSobreCerrado] = useState(true);
    const [moneda, setMoneda] = useState('ARS');
    // Desde el directorio se llega con ?invitar=a,b,c: el pedido arranca privado con esos proveedores.
    const [params] = useSearchParams();
    const preinvitados = (params.get('invitar') ?? '').split(',').filter(Boolean).slice(0, INVITADOS_MAX);
    const [privado, setPrivado] = useState(preinvitados.length > 0);
    const [invitados, setInvitados] = useState(preinvitados);
    const [verTodos, setVerTodos] = useState(false);
    const [documentos, setDocumentos] = useState([]);
    const [otroDoc, setOtroDoc] = useState('');
    const [adjuntos, setAdjuntos] = useState([]);
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);
    const { data } = useQuery(async (rp) => ({
        ...(await rp.valoresReferencia()),
        yo: (await rp.obtenerPersona(usuarioId)),
        proveedores: await rp.listarProveedores(),
        favoritos: await rp.favoritos(usuarioId),
        anteriores: rol === 'comprador' ? await rp.listarPedidos({ compradorId: usuarioId, visorId: usuarioId }) : [],
    }), [usuarioId]);
    const base = data ? valorDelRubro(data.valores, r, data.yo?.region) : undefined;
    const valor = base && data ? ajustar(base, factorInflacion(base.fecha, data.mesesIso, data.inflacion)) : undefined;
    const cant1 = Number(items[0]?.cantidad) || 0;
    const favoritos = useMemo(() => data?.favoritos ?? [], [data]);
    // Los favoritos van primero y se muestran aunque sean de otro rubro.
    const candidatos = useMemo(() => (data?.proveedores ?? [])
        .filter((p) => verTodos || p.rubros.includes(r) || favoritos.includes(p.id) || invitados.includes(p.id))
        .sort((a, b) => Number(favoritos.includes(b.id)) - Number(favoritos.includes(a.id))), [data, r, verTodos, favoritos, invitados]);
    // Repetir un pedido anterior: copia todo menos el cierre, que vuelve a una semana.
    const [repetido, setRepetido] = useState('');
    const repetir = (id) => {
        const p = data?.anteriores.find((x) => x.id === id);
        setRepetido(id);
        if (!p)
            return;
        setR(p.rubro);
        setTitulo(p.titulo);
        setDescripcion(p.descripcion);
        setItems(p.items.map((i, n) => ({ id: `i${n + 1}`, nombre: i.nombre, descripcion: i.descripcion, cantidad: String(i.cantidad), unidad: i.unidad })));
        setProximo(p.items.length + 1);
        setEntrega(p.entrega);
        setPago(p.pago);
        setZona(p.zona);
        setMoneda(p.moneda ?? 'ARS');
        setSobreCerrado(p.sobreCerrado);
        setPrivado(p.privado);
        setInvitados(p.privado ? p.invitados : []);
        setDocumentos(p.documentos);
        setAdjuntos(p.adjuntos);
        setFecha(enUnaSemana());
        setHora(HORA_CIERRE);
        if (p.privado || p.documentos.length || p.adjuntos.length)
            setMasOpciones(true);
    };
    const aRepetir = params.get('repetir');
    useEffect(() => {
        if (aRepetir && data && !repetido)
            repetir(aRepetir);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [aRepetir, data]);
    const [masOpciones, setMasOpciones] = useState(preinvitados.length > 0);
    const sumarFavoritos = () => setInvitados([...invitados, ...favoritos.filter((f) => !invitados.includes(f))].slice(0, INVITADOS_MAX));
    if (rol !== 'comprador')
        return _jsx("div", { className: "envoltura pagina", children: _jsx(Vacio, { titulo: "Solo los compradores publican pedidos", accion: { a: '/cotizaciones', texto: 'Ver pedidos' } }) });
    const cambiarItem = (i, k, v) => setItems(items.map((x, n) => (n === i ? { ...x, [k]: v } : x)));
    const sumarItem = () => { setItems([...items, filaNueva(proximo, rubro(r).unidad)]); setProximo(proximo + 1); };
    const cambiarRubro = (nuevo) => {
        // Las unidades que siguen siendo las del rubro anterior pasan a las del nuevo.
        setItems(items.map((x) => (x.unidad === rubro(r).unidad ? { ...x, unidad: rubro(nuevo).unidad } : x)));
        setR(nuevo);
    };
    const alternar = (lista, x) => (lista.includes(x) ? lista.filter((y) => y !== x) : [...lista, x]);
    const publicar = async (e) => {
        e.preventDefault();
        setError('');
        const its = items.map((x) => ({ id: x.id, nombre: x.nombre.trim(), descripcion: x.descripcion.trim(), cantidad: Number(x.cantidad), unidad: x.unidad.trim() }));
        setEnviando(true);
        try {
            const p = await repo.publicarPedido({
                compradorId: usuarioId, titulo: titulo.trim(), descripcion: descripcion.trim(), rubro: r, items: its,
                cantidad: its[0]?.cantidad ?? 0, unidad: its[0]?.unidad ?? '', entrega: entrega.trim(), pago, zona: (zona ?? data?.yo?.ciudad ?? '').trim(),
                cierre: fecha, cierraEn: fecha ? cierreIso(fecha, hora) : '', privado, invitados: privado ? invitados : [], sobreCerrado,
                documentos, adjuntos, moneda,
            });
            evento('pedido_publicado', { rubro: r, privado, items: its.length });
            const avisos = await repo.avisosDePedido(p.id);
            avisar(privado
                ? `Pedido ${p.id} publicado. Les avisamos a ${avisos.length} ${avisos.length === 1 ? 'proveedor invitado' : 'proveedores invitados'}.`
                : avisos.length
                    ? `Pedido ${p.id} publicado. Les llega a ${avisos.length} ${avisos.length === 1 ? 'proveedor' : 'proveedores'} de ${rubro(r).nombre.toLowerCase()}.`
                    : `Pedido ${p.id} publicado. Todavía no hay proveedores de ${rubro(r).nombre.toLowerCase()}; te avisamos cuando se sumen.`);
            ir(`/cotizaciones/${p.id}`);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo publicar el pedido.');
        }
        finally {
            setEnviando(false);
        }
    };
    return (_jsxs("div", { className: "envoltura pagina", children: [_jsx(Link, { to: "/cotizaciones", className: "enlace", children: "\u2190 Pedidos" }), _jsxs("header", { className: "pagina__cab", children: [_jsx("p", { className: "eyebrow", children: "Nuevo pedido de cotizaci\u00F3n" }), _jsx("h1", { children: "Qu\u00E9 necesit\u00E1s, en qu\u00E9 cantidades y hasta cu\u00E1ndo recib\u00EDs ofertas" }), _jsx("p", { className: "tenue", children: "Los proveedores cotizan cada \u00EDtem en el mismo formato, as\u00ED pod\u00E9s compararlos lado a lado." })] }), _jsxs("form", { className: "form pedido-form", onSubmit: publicar, children: [data && data.anteriores.length > 0 && (_jsxs("label", { className: "campo repetir", htmlFor: "np-repetir", children: [_jsx("span", { children: "\u00BFYa pediste algo parecido? Repet\u00ED un pedido anterior y cambi\u00E1 solo lo necesario" }), _jsxs("select", { id: "np-repetir", value: repetido, onChange: (e) => repetir(e.target.value), children: [_jsx("option", { value: "", children: "Empezar de cero" }), data.anteriores.map((p) => _jsxs("option", { value: p.id, children: [p.id, " \u00B7 ", p.titulo] }, p.id))] })] })), _jsxs(Seccion, { titulo: "1. El pedido", children: [_jsxs("div", { className: "form__fila", children: [_jsxs("label", { className: "campo", htmlFor: "np-rubro", children: [_jsx("span", { children: "Rubro" }), _jsx("select", { id: "np-rubro", value: r, onChange: (e) => cambiarRubro(e.target.value), children: _jsx(OpcionesRubro, {}) })] }), _jsxs("label", { className: "campo", htmlFor: "np-titulo", children: [_jsx("span", { children: "T\u00EDtulo" }), _jsx("input", { id: "np-titulo", maxLength: 140, value: titulo, onChange: (e) => setTitulo(e.target.value), placeholder: "Ej.: Insumos de empaque para la l\u00EDnea 2" })] })] }), _jsxs("label", { className: "campo", htmlFor: "np-desc", children: [_jsx("span", { children: "Descripci\u00F3n general (opcional)" }), _jsx("textarea", { id: "np-desc", rows: 2, maxLength: 1000, value: descripcion, onChange: (e) => setDescripcion(e.target.value), placeholder: "Contexto, condiciones o lo que no puede faltar." })] })] }), _jsxs(Seccion, { titulo: `2. Ítems · ${items.length}`, extra: items.length < ITEMS_MAX && _jsx("button", { type: "button", className: "btn btn--sec btn--chico", onClick: sumarItem, children: "Agregar \u00EDtem" }), children: [_jsx("p", { className: "tenue", children: "El proveedor no puede cambiar los \u00EDtems ni las cantidades: solo pone precio, descuento e IVA a cada uno." }), _jsx("ol", { className: "items-editor", children: items.map((x, i) => (_jsxs("li", { className: "items-editor__fila", children: [_jsxs("label", { className: "campo", htmlFor: `it-${x.id}-nombre`, children: [_jsxs("span", { children: ["\u00CDtem ", i + 1] }), _jsx("input", { id: `it-${x.id}-nombre`, maxLength: 120, value: x.nombre, onChange: (e) => cambiarItem(i, 'nombre', e.target.value), placeholder: "Ej.: Cajas de cart\u00F3n corrugado" })] }), _jsxs("label", { className: "campo", htmlFor: `it-${x.id}-cant`, children: [_jsx("span", { children: "Cantidad" }), _jsx("input", { id: `it-${x.id}-cant`, type: "number", min: 0, step: "any", className: "mono", value: x.cantidad, onChange: (e) => cambiarItem(i, 'cantidad', e.target.value) })] }), _jsxs("label", { className: "campo", htmlFor: `it-${x.id}-unidad`, children: [_jsx("span", { children: "Unidad" }), _jsx("input", { id: `it-${x.id}-unidad`, maxLength: 40, value: x.unidad, onChange: (e) => cambiarItem(i, 'unidad', e.target.value) })] }), _jsxs("label", { className: "campo items-editor__desc", htmlFor: `it-${x.id}-desc`, children: [_jsx("span", { children: "Descripci\u00F3n t\u00E9cnica (opcional)" }), _jsx("input", { id: `it-${x.id}-desc`, maxLength: 500, value: x.descripcion, onChange: (e) => cambiarItem(i, 'descripcion', e.target.value), placeholder: "Medidas, normas, marca o equivalente" })] }), items.length > 1 && _jsx("button", { type: "button", className: "enlace items-editor__quitar", onClick: () => setItems(items.filter((_, n) => n !== i)), children: "Quitar" })] }, x.id))) }), valor && moneda === 'ARS' && tieneValor(valor) && (_jsxs("div", { className: "referencia", children: [_jsxs("p", { className: "referencia__tit", children: [_jsx("span", { className: "etq", children: "Valor de referencia" }), " ", valor.concepto, ", por ", valor.unidad] }), _jsx(RangoValor, { v: valor, compacto: true }), cant1 > 0 && tieneValor(valor) && items[0].unidad === rubro(r).unidad && (() => { const t = estimarTotal(valor, cant1); return _jsxs("p", { className: "tenue", children: ["Para ", fmt.numero(cant1), " ", rubro(r).unidad, " del \u00EDtem 1: ", _jsxs("strong", { className: "mono", children: [fmt.moneda(t.min), " \u2013 ", fmt.moneda(t.max)] })] }); })(), _jsx(Link, { to: "/valores", className: "enlace", children: "Ver todos los valores de referencia" })] }))] }), _jsxs(Seccion, { titulo: "3. Entrega, pago y cierre", children: [_jsxs("label", { className: "campo", htmlFor: "np-entrega", children: [_jsx("span", { children: "Entrega: d\u00F3nde y en qu\u00E9 plazo" }), _jsx("input", { id: "np-entrega", maxLength: 140, value: entrega, onChange: (e) => setEntrega(e.target.value), placeholder: "Ej.: En planta Rosario, entregas parciales en 20 d\u00EDas" })] }), _jsxs("div", { className: "form__fila", children: [_jsxs("label", { className: "campo", htmlFor: "np-pago", children: [_jsx("span", { children: "Condici\u00F3n de pago" }), _jsx("select", { id: "np-pago", value: pago, onChange: (e) => setPago(e.target.value), children: CONDICIONES_PAGO.map((c) => _jsx("option", { children: c }, c)) })] }), _jsxs("label", { className: "campo", htmlFor: "np-zona", children: [_jsx("span", { children: "Zona" }), _jsx("input", { id: "np-zona", maxLength: 80, value: zona ?? data?.yo?.ciudad ?? '', onChange: (e) => setZona(e.target.value) })] })] }), _jsxs("fieldset", { className: "campo", children: [_jsx("legend", { children: "Moneda de las ofertas" }), _jsxs("div", { className: "opciones-fila", role: "radiogroup", "aria-label": "Moneda de las ofertas", children: [_jsxs("label", { className: "opcion", children: [_jsx("input", { type: "radio", name: "moneda", checked: moneda === 'ARS', onChange: () => setMoneda('ARS') }), _jsxs("span", { children: [_jsx("strong", { children: "Pesos" }), "Todos cotizan en pesos argentinos."] })] }), _jsxs("label", { className: "opcion", children: [_jsx("input", { type: "radio", name: "moneda", checked: moneda === 'USD', onChange: () => setMoneda('USD') }), _jsxs("span", { children: [_jsx("strong", { children: "D\u00F3lares" }), "Todos cotizan en d\u00F3lares. Al lado de cada total ves el equivalente en pesos al d\u00F3lar oficial BNA vendedor."] })] })] })] }), _jsxs("div", { className: "form__fila", children: [_jsxs("label", { className: "campo", htmlFor: "np-cierre", children: [_jsx("span", { children: "Recib\u00EDs ofertas hasta el" }), _jsx("input", { id: "np-cierre", type: "date", min: manana(), value: fecha, onChange: (e) => setFecha(e.target.value) })] }), _jsxs("label", { className: "campo", htmlFor: "np-hora", children: [_jsx("span", { children: "A las (hora de Buenos Aires)" }), _jsx("input", { id: "np-hora", type: "time", value: hora, onChange: (e) => setHora(e.target.value) })] })] }), _jsxs("label", { className: "opcion", children: [_jsx("input", { type: "checkbox", checked: sobreCerrado, onChange: (e) => setSobreCerrado(e.target.checked) }), _jsxs("span", { children: [_jsx("strong", { children: "Sobre cerrado" }), "Ves cu\u00E1ntas ofertas llegan, pero los precios se abren reci\u00E9n al cierre. Nadie, ni vos, ve precios antes. Es lo m\u00E1s transparente para compras corporativas."] })] })] }), _jsxs("details", { className: "mas-opciones", open: masOpciones, onToggle: (e) => setMasOpciones(e.target.open), children: [_jsxs("summary", { children: [_jsx("strong", { children: "M\u00E1s opciones" }), _jsxs("span", { className: "tenue", children: [" \u00B7 ", privado ? `Privado, ${invitados.length} ${invitados.length === 1 ? 'invitado' : 'invitados'}` : 'Público', " \u00B7 ", documentos.length ? `${documentos.length} ${documentos.length === 1 ? 'documento' : 'documentos'}` : 'sin documentos', adjuntos.length ? ` · ${adjuntos.length} ${adjuntos.length === 1 ? 'archivo' : 'archivos'}` : ''] })] }), _jsxs(Seccion, { titulo: "4. Qui\u00E9nes cotizan", children: [_jsxs("div", { className: "opciones-fila", role: "radiogroup", "aria-label": "Privacidad del pedido", children: [_jsxs("label", { className: "opcion", children: [_jsx("input", { type: "radio", name: "privacidad", checked: !privado, onChange: () => setPrivado(false) }), _jsxs("span", { children: [_jsx("strong", { children: "P\u00FAblico" }), "Lo recibe y lo puede cotizar cualquier proveedor de ", rubro(r).nombre.toLowerCase(), "."] })] }), _jsxs("label", { className: "opcion", children: [_jsx("input", { type: "radio", name: "privacidad", checked: privado, onChange: () => setPrivado(true) }), _jsxs("span", { children: [_jsx("strong", { children: "Privado" }), "Solo lo ven y lo cotizan los proveedores que invites."] })] })] }), privado && (_jsxs("div", { className: "invitados", children: [_jsxs("div", { className: "invitados__cab", children: [_jsxs("span", { className: "tenue", children: [invitados.length, " de hasta ", INVITADOS_MAX, " invitados"] }), favoritos.length > 0 && _jsxs("button", { type: "button", className: "btn btn--sec btn--chico", onClick: sumarFavoritos, disabled: favoritos.every((f) => invitados.includes(f)), children: ["\u2605 Invitar a mis ", favoritos.length, " favoritos"] }), _jsxs("label", { className: "opcion opcion--inline", children: [_jsx("input", { type: "checkbox", checked: verTodos, onChange: (e) => setVerTodos(e.target.checked) }), _jsx("span", { children: "Ver proveedores de todos los rubros" })] })] }), candidatos.length === 0 && _jsxs("p", { className: "tenue", children: ["No hay proveedores en ", rubro(r).nombre.toLowerCase(), " todav\u00EDa. Marc\u00E1 \"Ver proveedores de todos los rubros\"."] }), _jsx("div", { className: "invitados__lista", children: candidatos.map((p) => (_jsxs("label", { className: "opcion opcion--inline", children: [_jsx("input", { type: "checkbox", checked: invitados.includes(p.id), disabled: !invitados.includes(p.id) && invitados.length >= INVITADOS_MAX, onChange: () => setInvitados(alternar(invitados, p.id)) }), _jsxs("span", { children: [favoritos.includes(p.id) ? `★ ${p.empresa}` : p.empresa, " ", _jsxs("span", { className: "tenue", children: ["\u00B7 ", p.ciudad, " \u00B7 ", p.rubros.map((x) => rubro(x).nombre).join(', ')] })] })] }, p.id))) })] }))] }), _jsxs(Seccion, { titulo: "5. Documentaci\u00F3n", children: [_jsxs("fieldset", { className: "campo", children: [_jsx("legend", { children: "Documentos que el proveedor tiene que presentar con su oferta" }), _jsx("div", { className: "opciones-grilla", children: [...DOCUMENTOS_SUGERIDOS, ...documentos.filter((d) => !DOCUMENTOS_SUGERIDOS.includes(d))].map((d) => (_jsxs("label", { className: "opcion opcion--inline", children: [_jsx("input", { type: "checkbox", checked: documentos.includes(d), onChange: () => setDocumentos(alternar(documentos, d)) }), _jsx("span", { children: d })] }, d))) }), _jsxs("div", { className: "enlaces__nuevo", children: [_jsx("input", { "aria-label": "Otro documento", value: otroDoc, maxLength: 120, onChange: (e) => setOtroDoc(e.target.value), placeholder: "Otro documento" }), _jsx("button", { type: "button", className: "btn btn--sec btn--chico", disabled: !otroDoc.trim() || documentos.length >= 10, onClick: () => { if (!documentos.includes(otroDoc.trim()))
                                                            setDocumentos([...documentos, otroDoc.trim()]); setOtroDoc(''); }, children: "Agregar" })] })] }), _jsx(EditorEnlaces, { id: "np-adj", valor: adjuntos, onCambio: setAdjuntos, ayuda: "Planos, pliegos o normativas. Subilos a Drive o Dropbox, compartilos con enlace y pegalo ac\u00E1." })] })] }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsxs("div", { className: "form__acciones", children: [_jsx(Link, { to: "/cotizaciones", className: "btn btn--ter", children: "Cancelar" }), _jsx("button", { className: "btn btn--pri", disabled: enviando, children: enviando ? 'Publicando…' : 'Publicar pedido' })] })] })] }));
}
