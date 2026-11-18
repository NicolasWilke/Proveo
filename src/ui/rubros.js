import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { RUBROS, RUBROS_POR_GRUPO } from '@/domain/catalogos';
import { Chip } from './primitivas';
/** Opciones agrupadas para un `<select>` de rubro. */
export function OpcionesRubro() {
    return _jsx(_Fragment, { children: RUBROS_POR_GRUPO.map(({ grupo, rubros }) => (_jsx("optgroup", { label: grupo, children: rubros.map((r) => _jsx("option", { value: r.id, children: r.nombre }, r.id)) }, grupo))) });
}
/**
 * Filtro por rubro: como chips solo van los rubros que tienen algo para mostrar (más el elegido),
 * y el resto se elige en un desplegable. Con ~40 rubros, una fila de chips con todos no se puede leer.
 */
export function FiltroRubro({ valor, onCambio, conDatos, id }) {
    const hay = new Set(conDatos);
    if (valor)
        hay.add(valor);
    const chips = RUBROS.filter((r) => hay.has(r.id));
    return (_jsxs("div", { className: "chips chips--filtro", children: [_jsx(Chip, { activo: !valor, onClick: () => onCambio(undefined), children: "Todos los rubros" }), chips.map((r) => _jsx(Chip, { activo: valor === r.id, onClick: () => onCambio(r.id), children: r.nombre }, r.id)), _jsxs("select", { id: id, className: "filtro-rubro", "aria-label": "Elegir rubro", value: valor ?? '', onChange: (e) => onCambio((e.target.value || undefined)), children: [_jsx("option", { value: "", children: "M\u00E1s rubros\u2026" }), _jsx(OpcionesRubro, {})] })] }));
}
