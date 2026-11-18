import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { REGION } from '@/config/region';
import { region, rubro } from '@/domain/catalogos';
import { fmt } from '@/i18n';
import { Avatar, Chip, Pill, Sello } from '@/ui/primitivas';
import { MARCA } from '@/config/marca';
export const ventanaAbierta = (c) => !!c.ventanaHasta && fmt.diasHasta(c.ventanaHasta) >= 0;
/** La pieza central de la marca: el comprador con nombre, apellido y qué está comprando. */
export function FichaComprador({ c, nombreVisible = !c.semiAnonimo, accion, conSello = false, enlace = true }) {
    const nombre = nombreVisible ? `${c.nombre} ${c.apellido}` : 'Nombre visible al aceptar';
    const abierta = ventanaAbierta(c);
    const v = c.verificaciones;
    // Solo se muestra lo que el equipo de Unísono revisó de verdad (ver verificarCuenta en /admin).
    const revisado = v.idFiscal && v.mailCorporativo && v.cargoRevisado;
    return (_jsxs("article", { className: "ficha", children: [_jsxs("div", { className: "ficha__tira mono", children: [_jsx("span", { children: "Ficha de comprador" }), _jsxs("span", { children: [REGION.idFiscal.nombre, " ", c.verificaciones.idFiscal ? 'verificado' : 'sin verificar'] })] }), conSello && revisado && _jsxs(Sello, { className: "ficha__sello", children: ["Verificado", _jsx("br", {}), REGION.autoridadFiscal] }), _jsxs("div", { className: "ficha__cab", children: [_jsx(Avatar, { p: c, oculto: !nombreVisible, grande: true }), _jsxs("div", { className: "ficha__id", children: [_jsx("h3", { className: nombreVisible ? '' : 'is-oculto', children: enlace ? _jsx(Link, { to: `/red/${c.id}`, children: nombre }) : nombre }), _jsxs("p", { children: [c.cargo, " \u00B7 ", c.empresa] }), _jsx("p", { className: "tenue", children: c.ciudad || region(c.region).nombre })] })] }), _jsxs("ul", { className: "ficha__checks", children: [v.idFiscal ? _jsxs("li", { children: [REGION.idFiscal.nombre, " de la empresa validado en ", REGION.autoridadFiscal] }) : _jsxs("li", { className: "tenue", children: [REGION.idFiscal.nombre, " todav\u00EDa sin revisar por ", MARCA.nombre] }), v.mailCorporativo && _jsx("li", { children: "Mail corporativo verificado" })] }), _jsx("div", { className: "ficha__rubros", children: c.rubros.map((r) => _jsx(Chip, { children: rubro(r).nombre }, r)) }), _jsxs("div", { className: `ficha__ventana ${abierta ? 'is-abierta' : ''}`, children: [_jsxs("div", { children: [_jsx("span", { className: "etq", children: "Ventana de compra" }), _jsx("strong", { children: abierta && c.ventanaHasta ? `Abierta hasta ${fmt.fecha(c.ventanaHasta)}` : 'Sin compras en curso' }), c.foco && _jsx("span", { className: "tenue", children: c.foco })] }), accion] }), _jsxs("dl", { className: "ficha__reglas", children: [_jsxs("div", { children: [_jsx("dt", { children: "Acepta" }), _jsx("dd", { children: c.acepta })] }), _jsxs("div", { children: [_jsx("dt", { children: "No acepta" }), _jsx("dd", { children: c.noAcepta })] }), c.tasaRespuesta > 0 && _jsxs("div", { children: [_jsx("dt", { children: "Responde" }), _jsx("dd", { children: _jsxs(Pill, { tono: c.tasaRespuesta >= 70 ? 'ok' : 'neutro', children: [c.tasaRespuesta, "% de las solicitudes"] }) })] })] })] }));
}
