import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSesion } from '@/app/session';
import { useQuery } from '@/data/DataProvider';
import { REGIONES, RUBROS, region as regionDe } from '@/domain/catalogos';
import { FiltroRubro } from '@/ui/rubros';
import { ajustar, estimarTotal, factorInflacion, tieneValor, valoresPara } from '@/domain/valores';
import { fmt } from '@/i18n';
import { Pill, Vacio } from '@/ui/primitivas';
import { RangoValor } from './RangoValor';
const TIPOS = [['', 'Todos'], ['hora', 'Por hora'], ['unidad', 'Por unidad'], ['proyecto', 'Por trabajo']];
const FUENTE = {
    cotizaciones: { texto: 'Cotizaciones de la red', tono: 'sello' },
    arancel: { texto: 'Arancel profesional', tono: 'neutro' },
    convenio: { texto: 'Convenio colectivo', tono: 'neutro' },
    estimado: { texto: 'Estimado', tono: 'senal' },
};
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const mes = (iso = '') => (iso ? `${MES[Number(iso.slice(5, 7)) - 1]}-${iso.slice(2, 4)}` : '');
export function ValoresReferencia() {
    const { usuarioId } = useSesion();
    const { data } = useQuery((r) => r.valoresReferencia(), []);
    const { data: admin } = useQuery((r) => r.esAdmin(usuarioId), [usuarioId]);
    const [rub, setRub] = useState('');
    const [reg, setReg] = useState('');
    const [tipo, setTipo] = useState('');
    const [ajustado, setAjustado] = useState(true);
    const [calcId, setCalcId] = useState('');
    const [cantidad, setCantidad] = useState('100');
    const filas = useMemo(() => {
        if (!data)
            return [];
        const ultimo = data.mesesIso[data.mesesIso.length - 1];
        return valoresPara(data.valores, { rubro: rub || undefined, region: reg || undefined, tipo: tipo || undefined }).map((v) => {
            const factor = ajustado ? factorInflacion(v.fecha, data.mesesIso, data.inflacion) : 1;
            return { original: v, v: ajustar(v, factor), factor, viejo: !!v.fecha && !!ultimo && v.fecha < ultimo };
        });
    }, [data, rub, reg, tipo, ajustado]);
    // Agrupado por sector: arriba los sectores con más valores cargados y, dentro de cada uno, primero los que tienen valor.
    const cargados = (fs) => fs.filter((f) => tieneValor(f.v)).length;
    const sectores = RUBROS.map((r) => ({ r, filas: filas.filter((f) => f.v.rubro === r.id).sort((a, b) => Number(tieneValor(b.v)) - Number(tieneValor(a.v))) }))
        .filter((s) => s.filas.length > 0)
        .sort((a, b) => cargados(b.filas) - cargados(a.filas));
    if (!data)
        return _jsx("div", { className: "envoltura pagina" });
    // Sin serie de inflación cargada (base recién creada) no se ofrece el ajuste.
    const hayFechas = data.mesesIso.length > 0 && data.valores.some((v) => v.fecha && tieneValor(v));
    const conValor = filas.filter((f) => tieneValor(f.v));
    const calc = conValor.find((f) => f.v.id === calcId) ?? conValor.find((f) => f.v.principal) ?? conValor[0];
    const cant = Number(cantidad) || 0;
    const total = calc ? estimarTotal(calc.v, cant) : null;
    return (_jsxs("div", { className: "envoltura pagina", children: [_jsxs("header", { className: "pagina__cab", children: [_jsx("p", { className: "eyebrow", children: "Valores de referencia" }), _jsx("h1", { children: "Cu\u00E1nto se paga por hora, por unidad o por trabajo" }), admin && _jsx("p", { children: _jsx(Link, { to: "/admin/valores", className: "btn btn--sec btn--chico", children: "Editar valores" }) }), _jsx("p", { className: "tenue", children: "Rangos para armar un requerimiento o evaluar una cotizaci\u00F3n. Son una referencia, no un precio m\u00E1ximo ni m\u00EDnimo: cada trabajo tiene sus condiciones." })] }), _jsxs("div", { className: "filtros", children: [_jsxs("label", { className: "campo campo--inline", htmlFor: "v-region", children: [_jsx("span", { children: "Regi\u00F3n" }), _jsxs("select", { id: "v-region", value: reg, onChange: (e) => setReg(e.target.value), children: [_jsx("option", { value: "", children: "Todas" }), REGIONES.map((r) => _jsx("option", { value: r.id, children: r.nombre }, r.id))] })] }), _jsx("div", { className: "segmento", role: "group", "aria-label": "Tipo de valor", children: TIPOS.map(([t, txt]) => _jsx("button", { type: "button", "aria-pressed": tipo === t, className: tipo === t ? 'is-activo' : '', onClick: () => setTipo(t), children: txt }, txt)) }), hayFechas && _jsxs("label", { className: "opcion opcion--inline", children: [_jsx("input", { type: "checkbox", checked: ajustado, onChange: (e) => setAjustado(e.target.checked) }), _jsxs("span", { children: ["Llevar a pesos de ", mes(data.mesesIso[data.mesesIso.length - 1]), " por inflaci\u00F3n"] })] })] }), _jsx(FiltroRubro, { id: "val-rubro", valor: rub || undefined, onCambio: (r) => setRub(r ?? ''), conDatos: data.valores.map((v) => v.rubro) }), _jsxs("div", { className: "valores", children: [_jsxs("div", { className: "valores__lista", children: [filas.length === 0 && _jsx(Vacio, { titulo: "No hay valores con esos filtros", children: "Prob\u00E1 con todas las regiones o con otro tipo." }), sectores.map(({ r, filas: delSector }) => (_jsxs("section", { className: "valores__sector", "aria-labelledby": `sector-${r.id}`, children: [_jsxs("h2", { id: `sector-${r.id}`, className: "valores__sector-tit", children: [r.nombre, " ", _jsxs("span", { className: "tenue", children: ["\u00B7 ", delSector.length, " ", delSector.length === 1 ? 'valor' : 'valores'] })] }), delSector.map(({ v, original, factor, viejo }) => (_jsxs("article", { className: `valor ${calc?.v.id === v.id ? 'is-sel' : ''}`, children: [_jsxs("div", { className: "valor__cab", children: [_jsxs("div", { children: [_jsx("h3", { children: v.concepto }), _jsx("p", { className: "tenue", children: v.region === 'nacional' ? 'Nacional' : regionDe(v.region).nombre })] }), _jsxs("span", { className: "valor__unidad mono", children: ["por ", v.unidad] })] }), _jsx(RangoValor, { v: v }), (v.fuente || tieneValor(v)) && (_jsxs("div", { className: "valor__pie", children: [_jsxs("span", { className: "valor__fuente", children: [v.fuente && _jsx(Pill, { tono: FUENTE[v.fuente].tono, children: FUENTE[v.fuente].texto }), v.fuenteDetalle && _jsx("span", { className: "tenue", children: v.fuenteDetalle }), v.fecha && _jsxs("span", { className: "tenue", children: [v.muestras ? `${v.muestras} cotizaciones · ` : '', "actualizado ", mes(v.fecha), viejo && ajustado ? ` · ajustado ${fmt.pct((factor - 1) * 100)}` : ''] })] }), tieneValor(v) && _jsx("button", { type: "button", className: "enlace", onClick: () => setCalcId(v.id), children: "Calcular un requerimiento" })] })), viejo && !ajustado && original.fecha && _jsxs("p", { className: "nota", children: ["Valor de ", mes(original.fecha), " sin ajustar."] })] }, v.id)))] }, r.id)))] }), !calc && filas.length > 0 && (_jsxs("aside", { className: "calculadora", children: [_jsx("h2", { children: "Estim\u00E1 tu requerimiento" }), _jsx("p", { className: "tenue", children: "La calculadora se habilita cuando haya valores cargados para estos filtros." })] })), calc && total && (_jsxs("aside", { className: "calculadora", children: [_jsx("h2", { children: "Estim\u00E1 tu requerimiento" }), _jsxs("label", { className: "campo", htmlFor: "calc-concepto", children: [_jsx("span", { children: "Concepto" }), _jsx("select", { id: "calc-concepto", value: calc.v.id, onChange: (e) => setCalcId(e.target.value), children: conValor.map((f) => _jsxs("option", { value: f.v.id, children: [f.v.concepto, " \u00B7 ", f.v.region === 'nacional' ? 'Nacional' : regionDe(f.v.region).nombre] }, f.v.id)) })] }), _jsxs("label", { className: "campo", htmlFor: "calc-cant", children: [_jsxs("span", { children: ["Cantidad (", calc.v.unidad === 'hora' ? 'horas' : calc.v.unidad, ")"] }), _jsx("input", { id: "calc-cant", type: "number", min: 0, className: "mono", value: cantidad, onChange: (e) => setCantidad(e.target.value) })] }), _jsxs("div", { className: "calculadora__total", children: [_jsx("span", { className: "etq", children: "Rango esperado" }), _jsxs("strong", { className: "mono", children: [fmt.moneda(total.min), " \u2013 ", fmt.moneda(total.max)] }), _jsxs("span", { className: "tenue", children: ["Mediana ", fmt.moneda(total.mediana), " \u00B7 sin IVA"] })] }), _jsx(Link, { to: "/cotizaciones", className: "btn btn--pri", children: "Publicar un pedido con esta referencia" }), _jsx("p", { className: "nota", children: "Los proveedores ven el mismo rango. Una cotizaci\u00F3n por encima no est\u00E1 mal si incluye m\u00E1s servicio; pregunt\u00E1 qu\u00E9 incluye antes de descartarla." })] }))] })] }));
}
