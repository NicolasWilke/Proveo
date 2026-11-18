import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { base100, serieDesdeVariaciones, serieNominal } from '@/domain/indice';
import { fmt } from '@/i18n';
/** Precio del rubro vs. inflación, ambos base 100 al inicio del período. Escala lineal compartida. */
export function GraficoIndice({ serie, inflacion, meses, compacto = false }) {
    const precio = base100(serieNominal(serie));
    const ipc = serieDesdeVariaciones(inflacion);
    const W = 720, H = compacto ? 220 : 300, iz = 44, de = 112, ar = 18, ab = 30;
    const todos = [...precio, ...ipc];
    const paso = 5;
    const min = Math.floor(Math.min(...todos) / paso) * paso;
    const max = Math.ceil(Math.max(...todos) / paso) * paso;
    const x = (i) => iz + (i / (precio.length - 1)) * (W - iz - de);
    const y = (v) => ar + (1 - (v - min) / (max - min)) * (H - ar - ab);
    const linea = (vs) => vs.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${linea(precio)} L${x(precio.length - 1)},${y(min)} L${x(0)},${y(min)} Z`;
    const ticks = [];
    const salto = max - min > 30 ? 10 : 5;
    for (let v = min; v <= max; v += salto)
        ticks.push(v);
    const ult = precio.length - 1;
    const [yP, yI] = [y(precio[ult]), y(ipc[ult])];
    const separar = Math.abs(yP - yI) < 16;
    const etqP = separar && yP > yI ? yI + 16 : separar ? yI - 16 : yP;
    return (_jsx("figure", { className: "grafico", children: _jsxs("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": `${serie.item}: precio contra inflación, últimos 12 meses`, children: [ticks.map((v) => (_jsxs("g", { children: [_jsx("line", { x1: iz, x2: W - de, y1: y(v), y2: y(v), className: "g-grilla" }), _jsx("text", { x: iz - 8, y: y(v) + 4, className: "g-eje", textAnchor: "end", children: v })] }, v))), meses.map((m, i) => (i % (compacto ? 4 : 2) === 0 || i === ult) && (_jsx("text", { x: x(i), y: H - 8, className: "g-eje", textAnchor: "middle", children: m }, m))), _jsx("path", { d: area, className: "g-area" }), _jsx("path", { d: linea(ipc), className: "g-ipc" }), _jsx("path", { d: linea(precio), className: "g-precio" }), _jsx("circle", { cx: x(ult), cy: yP, r: 4.5, className: "g-punto" }), _jsx("circle", { cx: x(ult), cy: yI, r: 3.5, className: "g-punto-ipc" }), _jsxs("text", { x: x(ult) + 10, y: etqP + 4, className: "g-etq g-etq--precio", children: ["Precio ", fmt.numero(precio[ult])] }), _jsxs("text", { x: x(ult) + 10, y: yI + 4, className: "g-etq", children: ["Inflaci\u00F3n ", fmt.numero(ipc[ult])] })] }) }));
}
