import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { region, rubro } from '@/domain/catalogos';
import { PLANES } from '@/domain/planes';
import { insignias, promedioPonderado, reputacionVisible } from '@/domain/directorio';
import { Avatar, Chip, Estrellas, Pill } from '@/ui/primitivas';
export const promedio = (p) => p.resenas.length ? p.resenas.reduce((a, r) => a + (r.entrega + r.calidad + r.facturacion) / 3, 0) / p.resenas.length : 0;
export const NOMBRE_INSIGNIA = { verificado: 'Verificado', top: 'Top Rated', certificado: 'Certificado' };
export function Insignias({ p }) {
    const lista = insignias(p);
    if (!lista.length)
        return null;
    return _jsx("div", { className: "chips", children: lista.map((i) => _jsx(Pill, { tono: i === 'top' ? 'ok' : 'sello', children: NOMBRE_INSIGNIA[i] }, i)) });
}
export function Reputacion({ p }) {
    if (!reputacionVisible(p))
        return _jsxs("span", { className: "tenue", children: ["Proveedor nuevo en la red", p.resenas.length ? ` (${p.resenas.length} ${p.resenas.length === 1 ? 'reseña' : 'reseñas'})` : ''] });
    const prom = promedioPonderado(p);
    return _jsxs("span", { children: [_jsx(Estrellas, { valor: prom }), " ", _jsx("span", { className: "mono", children: prom.toFixed(1) }), " ", _jsxs("span", { className: "tenue", children: ["(", p.resenas.length, ")"] })] });
}
export function TarjetaProveedor({ p, seleccionado, onSeleccionar }) {
    return (_jsxs("article", { className: `tarjeta ${seleccionado ? 'is-seleccionada' : ''}`, children: [_jsxs("div", { className: "tarjeta__cab", children: [_jsx(Avatar, { p: p }), _jsxs("div", { className: "tarjeta__id", children: [_jsx("h3", { children: _jsx(Link, { to: `/red/${p.id}`, children: p.empresa }) }), _jsxs("p", { children: [p.nombre, " ", p.apellido, " \u00B7 ", p.cargo] })] }), PLANES[p.plan].destacado && _jsx("span", { title: "Visibilidad paga: no es una insignia de m\u00E9rito", children: _jsx(Pill, { tono: "neutro", children: "Destacado \u00B7 publicidad" }) })] }), _jsx(Insignias, { p: p }), _jsx("div", { className: "tarjeta__rubros", children: p.rubros.map((r) => _jsx(Chip, { children: rubro(r).nombre }, r)) }), _jsxs("div", { className: "tarjeta__pie", children: [_jsxs("span", { className: "tenue", children: [p.ciudad, " \u00B7 ", region(p.region).nombre] }), _jsx(Reputacion, { p: p })] }), onSeleccionar && (_jsxs("label", { className: "tarjeta__sel", children: [_jsx("input", { type: "checkbox", checked: !!seleccionado, onChange: (e) => onSeleccionar(e.target.checked) }), _jsx("span", { children: "Seleccionar para comparar o invitar" })] }))] }));
}
export function TarjetaComprador({ c, oculto }) {
    return (_jsxs("article", { className: "tarjeta", children: [_jsxs("div", { className: "tarjeta__cab", children: [_jsx(Avatar, { p: c, oculto: oculto }), _jsxs("div", { className: "tarjeta__id", children: [_jsx("h3", { children: _jsx(Link, { to: `/red/${c.id}`, children: oculto ? 'Nombre visible al aceptar' : `${c.nombre} ${c.apellido}` }) }), _jsxs("p", { children: [c.cargo, " \u00B7 ", c.empresa] })] })] }), _jsx("div", { className: "tarjeta__rubros", children: c.rubros.map((r) => _jsx(Chip, { children: rubro(r).nombre }, r)) }), _jsxs("div", { className: "tarjeta__pie", children: [_jsx("span", { className: "tenue", children: c.ciudad }), c.ventanaHasta ? _jsxs(Pill, { tono: "senal", children: ["Compra hasta ", c.ventanaHasta.slice(8, 10), "/", c.ventanaHasta.slice(5, 7)] }) : _jsx("span", { className: "tenue", children: "Sin ventana abierta" })] })] }));
}
