import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSesion } from '@/app/session';
import { useQuery, useRepo } from '@/data/DataProvider';
import { rubro } from '@/domain/catalogos';
import { FiltroRubro } from '@/ui/rubros';
import { MENSAJE_VALOR_MAX, PLAZO_RESPUESTA_HABILES, VENTANA_DIAS, antiguedad, cantidadComparable, rangoCantidad, venceEn } from '@/domain/antecedentes';
import { fmt } from '@/i18n';
import { Pill, Seccion, Vacio } from '@/ui/primitivas';
import { useToast } from '@/ui/Toast';
const SEMAFORO = { vigente: 'ok', 'por-vencer': 'senal', vencida: 'neutro' };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const mes = (iso) => `${MESES[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
/**
 * Compras recientes: qué se adjudicó en la red en los últimos 90 días y a quién, sin precio ni comprador.
 * Si a otro comprador le sirve, le pide al proveedor su valor vigente en vez de armar un pedido desde cero.
 */
export function ComprasRecientes() {
    const { rol, usuarioId } = useSesion();
    const [rub, setRub] = useState();
    const [texto, setTexto] = useState('');
    const { data } = useQuery(async (r) => {
        if (rol !== 'comprador')
            return null;
        const [antecedentes, provs, mias] = await Promise.all([r.antecedentes(), r.listarProveedores(), r.solicitudesValor({ compradorId: usuarioId })]);
        return { antecedentes, provs, mias };
    }, [rol, usuarioId]);
    if (rol !== 'comprador') {
        return _jsx("div", { className: "envoltura pagina", children: _jsx(Vacio, { titulo: "Compras recientes es una herramienta para compradores", children: "Los proveedores reciben ac\u00E1 los pedidos de valor desde su panel." }) });
    }
    if (!data)
        return _jsx("div", { className: "envoltura pagina" });
    const { antecedentes, provs, mias } = data;
    const q = texto.trim().toLowerCase();
    const lista = antecedentes.filter((a) => (!rub || a.rubro === rub) && (!q || `${a.nombre} ${a.descripcion} ${a.zona}`.toLowerCase().includes(q)));
    const prov = (id) => provs.find((p) => p.id === id);
    return (_jsxs("div", { className: "envoltura pagina", children: [_jsxs("header", { className: "pagina__cab", children: [_jsx("p", { className: "eyebrow", children: "Compras recientes" }), _jsx("h1", { children: "Lo que ya se compr\u00F3 en la red, para no empezar de cero" }), _jsxs("p", { className: "tenue", children: ["\u00CDtems adjudicados en los \u00FAltimos ", VENTANA_DIAS, " d\u00EDas. El precio adjudicado nunca se muestra: si te sirve, pedile al proveedor su valor vigente. Tiene ", PLAZO_RESPUESTA_HABILES, " d\u00EDas h\u00E1biles para responder."] })] }), _jsx("div", { className: "filtros", children: _jsxs("label", { className: "campo campo--inline", htmlFor: "rec-buscar", children: [_jsx("span", { children: "Buscar" }), _jsx("input", { id: "rec-buscar", type: "search", placeholder: "Producto, servicio o zona", value: texto, onChange: (e) => setTexto(e.target.value) })] }) }), _jsx(FiltroRubro, { id: "rec-rubro", valor: rub, onCambio: setRub, conDatos: antecedentes.map((a) => a.rubro) }), lista.length === 0 && _jsx(Vacio, { titulo: "No hay compras recientes con esos filtros", children: "Prob\u00E1 con todos los rubros o con otra palabra." }), _jsx("div", { className: "grilla-3", children: lista.map((a) => _jsx(TarjetaAntecedente, { a: a, prov: prov(a.proveedorId), pedida: mias.find((s) => s.antecedenteId === a.id && s.estado === 'pendiente') }, a.id)) }), _jsx(MisSolicitudes, { mias: mias, prov: prov })] }));
}
function TarjetaAntecedente({ a, prov, pedida }) {
    const [abierto, setAbierto] = useState(false);
    const ant = antiguedad(a);
    const [min, max] = rangoCantidad(a.cantidad);
    return (_jsxs("article", { className: "tarjeta antecedente", children: [_jsxs("div", { className: "antecedente__cab", children: [_jsx("span", { className: "eyebrow", children: rubro(a.rubro).nombre }), _jsx(Pill, { tono: SEMAFORO[ant.estado], children: ant.estado === 'por-vencer' ? `Sale en ${ant.quedan} días` : 'Vigente' })] }), _jsx("h3", { children: a.nombre }), a.descripcion && _jsx("p", { className: "tenue", children: a.descripcion }), _jsxs("dl", { className: "antecedente__datos", children: [_jsxs("div", { children: [_jsx("dt", { children: "Cantidad" }), _jsxs("dd", { className: "mono", children: [fmt.numero(min), " a ", fmt.numero(max), " ", a.unidad] })] }), _jsxs("div", { children: [_jsx("dt", { children: "Adjudicado" }), _jsx("dd", { children: mes(a.adjudicado) })] }), _jsxs("div", { children: [_jsx("dt", { children: "Zona" }), _jsx("dd", { children: a.zona })] }), _jsxs("div", { children: [_jsx("dt", { children: "Comprador" }), _jsx("dd", { children: a.sectorComprador ? `Del sector ${a.sectorComprador.toLowerCase()}` : 'De la red' })] })] }), _jsxs("p", { children: ["Proveedor: ", prov ? _jsx(Link, { to: `/red/${prov.id}`, children: prov.empresa }) : 'Proveedor de la red', " ", _jsx(Pill, { tono: "neutro", children: "Precio reservado" })] }), pedida
                ? _jsxs("p", { className: "tenue", children: ["Ya le pediste el valor el ", fmt.fecha(pedida.creada), ". Responde hasta el ", fmt.fecha(venceEn(pedida.creada)), "."] })
                : abierto
                    ? _jsx(SolicitarValor, { a: a, onListo: () => setAbierto(false) })
                    : _jsx("button", { className: "btn btn--pri btn--chico", onClick: () => setAbierto(true), children: "Solicitar valor" })] }));
}
function SolicitarValor({ a, onListo }) {
    const { usuarioId } = useSesion();
    const repo = useRepo();
    const avisar = useToast();
    const [cantidad, setCantidad] = useState(String(a.cantidad));
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);
    const n = Number(cantidad);
    const enviar = async () => {
        setError('');
        setEnviando(true);
        try {
            await repo.solicitarValor(a.id, usuarioId, n, mensaje);
            avisar(`Pedido enviado. El proveedor tiene hasta el ${fmt.fecha(venceEn(new Date().toISOString().slice(0, 10)))} para responder.`);
            onListo();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo enviar el pedido.');
            setEnviando(false);
        }
    };
    return (_jsxs("div", { className: "antecedente__form", children: [_jsxs("label", { className: "campo", htmlFor: `cant-${a.id}`, children: [_jsxs("span", { children: ["Cantidad que necesit\u00E1s (", a.unidad, ")"] }), _jsx("input", { id: `cant-${a.id}`, type: "number", min: 1, value: cantidad, onChange: (e) => setCantidad(e.target.value) })] }), n > 0 && !cantidadComparable(a.cantidad, n) && _jsx("p", { className: "nota", children: "Es bastante distinta de la cantidad adjudicada: el valor puede cambiar. Si es mucho m\u00E1s, conviene un pedido de cotizaci\u00F3n." }), _jsxs("label", { className: "campo", htmlFor: `msj-${a.id}`, children: [_jsx("span", { children: "Mensaje para el proveedor (opcional)" }), _jsx("textarea", { id: `msj-${a.id}`, rows: 2, maxLength: MENSAJE_VALOR_MAX, value: mensaje, onChange: (e) => setMensaje(e.target.value), placeholder: "Ej.: entrega en Rosario, pago a 30 d\u00EDas." })] }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsxs("div", { className: "form__acciones", children: [_jsx("button", { className: "btn btn--ter btn--chico", onClick: onListo, children: "Cancelar" }), _jsx("button", { className: "btn btn--pri btn--chico", disabled: !(n > 0) || enviando, onClick: enviar, children: enviando ? 'Enviando…' : 'Pedir valor vigente' })] })] }));
}
const ESTADO = { pendiente: ['Esperando respuesta', 'senal'], respondida: ['Respondida', 'ok'], declinada: ['No cotizó', 'neutro'] };
function MisSolicitudes({ mias, prov }) {
    if (!mias.length)
        return null;
    return (_jsx(Seccion, { titulo: `Tus pedidos de valor · ${mias.length}`, children: _jsx("div", { className: "pila", children: mias.map((s) => (_jsxs("article", { className: "solicitud", children: [_jsxs("div", { className: "solicitud__cab", children: [_jsxs("div", { children: [_jsx("strong", { children: s.nombre }), _jsxs("span", { className: "tenue bloque-linea", children: [prov(s.proveedorId)?.empresa ?? 'Proveedor', " \u00B7 ", fmt.numero(s.cantidad), " ", s.unidad, " \u00B7 pedido el ", fmt.fecha(s.creada)] })] }), _jsx(Pill, { tono: ESTADO[s.estado][1], children: ESTADO[s.estado][0] })] }), s.estado === 'respondida' && (_jsxs("p", { children: [_jsx("strong", { className: "mono", children: fmt.moneda(s.precioUnitario) }), " por ", s.unidad.replace(/s$/, ''), ", sin IVA \u00B7 vale hasta el ", fmt.fecha(s.vigencia), s.nota && _jsxs(_Fragment, { children: [" \u00B7 ", s.nota] })] })), s.estado === 'pendiente' && _jsxs("p", { className: "tenue", children: ["Responde hasta el ", fmt.fecha(venceEn(s.creada)), "."] })] }, s.id))) }) }));
}
