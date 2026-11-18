import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
const clave = (id) => `proveo:primeros-pasos-oculto:${id}`;
const leerOculto = (id) => { try {
    return localStorage.getItem(clave(id)) === '1';
}
catch {
    return false;
} };
/** Tarjeta de primeros pasos para cuentas nuevas. Desaparece sola cuando están todos hechos, o si la ocultan. */
export function PrimerosPasos({ usuarioId, pasos }) {
    const [oculto, setOculto] = useState(() => leerOculto(usuarioId));
    const hechos = pasos.filter((p) => p.hecho).length;
    if (oculto || hechos === pasos.length)
        return null;
    const ocultar = () => { try {
        localStorage.setItem(clave(usuarioId), '1');
    }
    catch { /* sin almacenamiento: se oculta hasta recargar */ } setOculto(true); };
    return (_jsxs("section", { className: "seccion primeros-pasos", "aria-labelledby": "pp-tit", children: [_jsxs("header", { className: "primeros-pasos__cab", children: [_jsxs("h2", { id: "pp-tit", children: ["Primeros pasos \u00B7 ", hechos, " de ", pasos.length] }), _jsx("button", { type: "button", className: "enlace", onClick: ocultar, children: "Ocultar" })] }), _jsx("ol", { className: "primeros-pasos__lista", children: pasos.map((p) => (_jsxs("li", { className: p.hecho ? 'is-hecho' : '', children: [_jsx("span", { className: "primeros-pasos__marca", "aria-hidden": "true", children: p.hecho ? '✓' : '' }), _jsxs("span", { className: "primeros-pasos__txt", children: [p.texto, p.hecho && _jsx("span", { className: "sr-solo", children: " (hecho)" })] }), !p.hecho && _jsx(Link, { to: p.a, className: "btn btn--sec btn--chico", children: p.accion })] }, p.texto))) })] }));
}
