import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '@/i18n';
export function Sello({ children, className = '' }) {
    return _jsx("span", { className: `sello ${className}`, "aria-hidden": "true", children: children });
}
export function Avatar({ p, oculto = false, grande = false }) {
    if (p.logo && !oculto)
        return _jsx("img", { className: `avatar avatar--img ${grande ? 'avatar--grande' : ''}`, src: p.logo, alt: "" });
    const ini = oculto ? '··' : `${p.nombre[0] ?? ''}${p.apellido[0] ?? ''}`;
    return _jsx("span", { className: `avatar avatar--${p.rol} ${grande ? 'avatar--grande' : ''}`, "aria-hidden": "true", children: ini });
}
export function Chip({ children, activo, onClick }) {
    if (!onClick)
        return _jsx("span", { className: "chip", children: children });
    return _jsx("button", { type: "button", className: `chip chip--boton ${activo ? 'chip--activo' : ''}`, "aria-pressed": activo, onClick: onClick, children: children });
}
export function Pill({ tono = 'neutro', children }) {
    return _jsx("span", { className: `pill pill--${tono}`, children: children });
}
export function Medidor({ usado, total, etiqueta }) {
    const pct = total === null ? 100 : Math.min(100, (usado / total) * 100);
    const critico = total !== null && usado >= total;
    return (_jsxs("div", { className: "medidor", children: [_jsxs("div", { className: "medidor__fila", children: [_jsx("span", { children: etiqueta }), _jsx("span", { className: "mono", children: total === null ? `${usado} · sin límite` : `${usado} de ${total}` })] }), _jsx("div", { className: `medidor__barra ${total === null ? 'medidor__barra--libre' : ''}`, children: _jsx("span", { style: { width: `${pct}%` }, className: critico ? 'is-critico' : '' }) })] }));
}
export function Copiable({ texto, etiqueta }) {
    const [ok, setOk] = useState(false);
    const copiar = async (e) => {
        try {
            await navigator.clipboard.writeText(texto);
            setOk(true);
            setTimeout(() => setOk(false), 1600);
        }
        catch {
            const sel = window.getSelection();
            const nodo = e.currentTarget.previousElementSibling;
            if (sel && nodo) {
                const r = document.createRange();
                r.selectNodeContents(nodo);
                sel.removeAllRanges();
                sel.addRange(r);
            }
        }
    };
    return (_jsxs("div", { className: "copiable", children: [_jsx("span", { className: "copiable__etq", children: etiqueta }), _jsx("span", { className: "copiable__val mono", children: texto }), _jsx("button", { className: "btn btn--mini", type: "button", onClick: copiar, children: ok ? t.acciones.copiado : t.acciones.copiar })] }));
}
export function Vacio({ titulo, children, accion }) {
    return (_jsxs("div", { className: "vacio", children: [_jsx("p", { className: "vacio__tit", children: titulo }), children && _jsx("p", { children: children }), accion && _jsx(Link, { className: "btn btn--sec", to: accion.a, children: accion.texto })] }));
}
export function Estrellas({ valor }) {
    return _jsxs("span", { className: "estrellas", "aria-label": `${valor} de 5`, children: ['★★★★★'.slice(0, Math.round(valor)), _jsx("span", { children: '★★★★★'.slice(Math.round(valor)) })] });
}
export function Seccion({ titulo, extra, children, id }) {
    return (_jsxs("section", { className: "seccion", id: id, children: [_jsxs("header", { className: "seccion__cab", children: [_jsx("h2", { children: titulo }), extra] }), children] }));
}
