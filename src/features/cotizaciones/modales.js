import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { evento } from '@/app/medicion';
import { useState } from 'react';
import { useQuery, useRepo } from '@/data/DataProvider';
import { CONDICIONES_PAGO } from '@/domain/catalogos';
import { desvioVsIndice } from '@/domain/indice';
import { IVAS, horaDeCierre, linea } from '@/domain/rfq';
import { fmt } from '@/i18n';
import { Modal } from '@/ui/Modal';
import { useToast } from '@/ui/Toast';
import { EditorEnlaces } from './Enlaces';
import { useDolar } from './Equivalente';
import { equivalente, monedaDe } from '@/domain/moneda';
import { LecturaIndice } from './LecturaIndice';
const aNumero = (s) => Number(s.replace(/\./g, '').replace(',', '.'));
const enDias = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
/** El proveedor cotiza cada ítem: precio, descuento e IVA. Los ítems y cantidades no se tocan. */
export function CotizarModal({ pedido, proveedorId, onCerrar }) {
    const repo = useRepo();
    const avisar = useToast();
    const { data: indice } = useQuery((r) => r.indicePrecios(), []);
    const mon = monedaDe(pedido);
    // El índice está en pesos: solo sirve de referencia en pedidos en pesos.
    const ref = pedido.items.length === 1 && mon === 'ARS' ? indice?.series.find((s) => s.rubro === pedido.rubro) : undefined;
    const dolar = useDolar();
    const [precios, setPrecios] = useState(() => Object.fromEntries(pedido.items.map((i) => [i.id, { precio: '', descuento: '0', iva: '21' }])));
    const [plazo, setPlazo] = useState('15');
    const [vigencia, setVigencia] = useState(enDias(15));
    const [pago, setPago] = useState(pedido.pago);
    const [nota, setNota] = useState('');
    const [adjuntos, setAdjuntos] = useState([]);
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);
    const items = pedido.items.map((i) => ({
        itemId: i.id, precioUnitario: aNumero(precios[i.id].precio), descuento: aNumero(precios[i.id].descuento) || 0, iva: Number(precios[i.id].iva),
    }));
    const lineas = pedido.items.map((i, n) => (items[n].precioUnitario > 0 ? linea(i, items[n]) : null));
    const neto = lineas.reduce((s, l) => s + (l?.neto ?? 0), 0);
    const iva = lineas.reduce((s, l) => s + (l?.iva ?? 0), 0);
    const completos = lineas.every(Boolean);
    const usd = mon === 'USD';
    /** Pesos al dólar del día, o null si todavía no cargó o la fuente no responde. */
    const enPesos = (n) => (dolar && n > 0 ? fmt.importe(equivalente(n, 'USD', dolar), 'ARS') : '—');
    const set = (id, k, v) => setPrecios({ ...precios, [id]: { ...precios[id], [k]: v } });
    const enviar = async (e) => {
        e.preventDefault();
        setError('');
        setEnviando(true);
        try {
            await repo.cotizar({
                pedidoId: pedido.id, proveedorId, items, precioUnitario: lineas[0]?.unitarioNeto ?? 0,
                plazoDias: Number(plazo), vigencia, pago, nota: nota.trim(), adjuntos,
                ...(dolar ? { tipoCambio: dolar } : {}),
            });
            evento('oferta_enviada', { rubro: pedido.rubro, moneda: pedido.moneda ?? 'ARS' });
            avisar(pedido.sobreCerrado
                ? `Oferta enviada y sellada. El comprador ve que cotizaste, pero tus precios recién al cierre (${fmt.fecha(pedido.cierre)} ${horaDeCierre(pedido.cierraEn)}).`
                : 'Oferta enviada. El comprador la ve en el comparador, en el mismo formato que las demás.');
            onCerrar();
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setEnviando(false);
        }
    };
    return (_jsx(Modal, { titulo: `Cotizar ${pedido.id}`, onCerrar: onCerrar, ancho: 820, children: _jsxs("form", { className: "form", onSubmit: enviar, children: [_jsx("p", { children: _jsx("strong", { children: pedido.titulo }) }), _jsxs("p", { className: "tenue", children: [pedido.entrega, " \u00B7 Pago pedido: ", pedido.pago, " \u00B7 Cierra ", fmt.fecha(pedido.cierre), " ", horaDeCierre(pedido.cierraEn)] }), _jsx("div", { className: "tabla-envoltura", children: _jsxs("table", { className: "tabla tabla--cotizar", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u00CDtem" }), _jsx("th", { className: "num", children: "Cantidad" }), _jsxs("th", { className: "num", children: ["Precio unitario", mon === 'USD' ? ' (US$)' : ''] }), _jsx("th", { className: "num", children: "Desc. %" }), _jsx("th", { children: "IVA" }), _jsx("th", { className: "num", children: "Subtotal neto" })] }) }), _jsx("tbody", { children: pedido.items.map((i, n) => (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("span", { className: "tabla__tit", children: i.nombre }), i.descripcion && _jsx("span", { className: "tenue bloque-linea", children: i.descripcion })] }), _jsxs("td", { className: "num mono", children: [fmt.numero(i.cantidad), " ", _jsx("span", { className: "tenue", children: i.unidad })] }), _jsxs("td", { className: "num", children: [_jsx("input", { "aria-label": `Precio unitario de ${i.nombre}`, inputMode: "decimal", className: "mono entrada-num", value: precios[i.id].precio, onChange: (e) => set(i.id, 'precio', e.target.value), placeholder: "Precio" }), usd && items[n].precioUnitario > 0 && dolar && _jsxs("span", { className: "tenue bloque-linea mono", children: ["\u2248 ", enPesos(items[n].precioUnitario)] })] }), _jsx("td", { className: "num", children: _jsx("input", { "aria-label": `Descuento de ${i.nombre}`, inputMode: "decimal", className: "mono entrada-num entrada-num--chica", value: precios[i.id].descuento, onChange: (e) => set(i.id, 'descuento', e.target.value) }) }), _jsx("td", { children: _jsx("select", { className: "entrada-iva", "aria-label": `IVA de ${i.nombre}`, value: precios[i.id].iva, onChange: (e) => set(i.id, 'iva', e.target.value), children: IVAS.map((x) => _jsxs("option", { value: x, children: [fmt.numero(x), " %"] }, x)) }) }), _jsx("td", { className: "num mono", children: lineas[n] ? fmt.importe(lineas[n].neto, mon) : '—' })] }, i.id))) }), _jsxs("tfoot", { children: [_jsxs("tr", { children: [_jsx("td", { colSpan: 5, children: "Neto" }), _jsx("td", { className: "num mono", children: fmt.importe(neto, mon) })] }), _jsxs("tr", { children: [_jsx("td", { colSpan: 5, children: "IVA" }), _jsx("td", { className: "num mono", children: fmt.importe(iva, mon) })] }), _jsxs("tr", { className: "tabla__total", children: [_jsxs("td", { colSpan: 5, children: ["Total", !completos && _jsx("span", { className: "tenue", children: " \u00B7 faltan precios" })] }), _jsx("td", { className: "num mono", children: fmt.importe(neto + iva, mon) })] })] })] }) }), usd && (_jsxs("div", { className: "doble-moneda", children: [_jsxs("div", { className: "doble-moneda__caja", children: [_jsx("span", { className: "doble-moneda__tit", children: "Total en d\u00F3lares" }), _jsx("strong", { className: "mono", children: fmt.importe(neto + iva, 'USD') }), _jsxs("span", { className: "tenue", children: ["Neto ", fmt.importe(neto, 'USD'), " + IVA ", fmt.importe(iva, 'USD')] })] }), _jsxs("div", { className: "doble-moneda__caja doble-moneda__caja--pesos", children: [_jsx("span", { className: "doble-moneda__tit", children: "Equivale en pesos" }), _jsx("strong", { className: "mono", children: enPesos(neto + iva) }), _jsx("span", { className: "tenue", children: dolar
                                        ? _jsxs(_Fragment, { children: ["D\u00F3lar oficial BNA vendedor ", fmt.importe(dolar.valor, 'ARS'), " (", fmt.fecha(dolar.fecha), "). Queda guardado con tu oferta."] })
                                        : _jsx(_Fragment, { children: "El d\u00F3lar del d\u00EDa todav\u00EDa no carg\u00F3. Tu oferta en d\u00F3lares vale igual." }) })] })] })), ref && !lineas[0] && _jsxs("p", { className: "nota", children: ["Referencia del \u00EDndice para este rubro: mediana de ", _jsx("strong", { className: "mono", children: fmt.moneda(ref.actual) }), " por unidad. Es orientativa: pon\u00E9 tu precio real."] }), ref && lineas[0] && (_jsxs("p", { className: "nota", children: ["Mediana del \u00EDndice: ", _jsx("strong", { className: "mono", children: fmt.moneda(ref.actual) }), ". Tu precio neto queda ", _jsx(LecturaIndice, { desvio: desvioVsIndice(lineas[0].unitarioNeto, ref.actual) })] })), _jsxs("div", { className: "form__fila", children: [_jsxs("label", { className: "campo", htmlFor: "cot-plazo", children: [_jsx("span", { children: "Plazo de entrega (d\u00EDas)" }), _jsx("input", { id: "cot-plazo", type: "number", min: 0, max: 365, value: plazo, onChange: (e) => setPlazo(e.target.value) })] }), _jsxs("label", { className: "campo", htmlFor: "cot-vig", children: [_jsx("span", { children: "Oferta v\u00E1lida hasta" }), _jsx("input", { id: "cot-vig", type: "date", min: enDias(0), value: vigencia, onChange: (e) => setVigencia(e.target.value) })] })] }), _jsxs("label", { className: "campo", htmlFor: "cot-pago", children: [_jsx("span", { children: "Condici\u00F3n de pago" }), _jsx("select", { id: "cot-pago", value: pago, onChange: (e) => setPago(e.target.value), children: [...new Set([pedido.pago, ...CONDICIONES_PAGO])].map((c) => _jsx("option", { children: c }, c)) })] }), _jsxs("label", { className: "campo", htmlFor: "cot-nota", children: [_jsx("span", { children: "Aclaraciones (opcional)" }), _jsx("input", { id: "cot-nota", maxLength: 500, value: nota, onChange: (e) => setNota(e.target.value), placeholder: "Ej.: 50% anticipo, 50% contra entrega" })] }), pedido.documentos.length > 0 && (_jsxs("p", { className: "nota", children: ["El comprador pide: ", _jsx("strong", { children: pedido.documentos.join(', ') }), ". Sumalos como enlaces ac\u00E1 abajo."] })), _jsx(EditorEnlaces, { id: "cot-adj", valor: adjuntos, onCambio: setAdjuntos, ayuda: "Tu cotizaci\u00F3n formal en PDF o los certificados, compartidos desde Drive o Dropbox." }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsx("p", { className: "tenue", children: "Al enviar, la oferta queda guardada y no se puede editar." }), _jsxs("div", { className: "form__acciones", children: [_jsx("button", { type: "button", className: "btn btn--ter", onClick: onCerrar, children: "Cancelar" }), _jsx("button", { className: "btn btn--pri", disabled: !completos || enviando, children: enviando ? 'Enviando…' : 'Enviar oferta' })] })] }) }));
}
