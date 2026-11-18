import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { tieneValor } from '@/domain/valores';
import { fmt } from '@/i18n';
/** Barra mínimo–máximo con la mediana marcada. Escala propia de cada fila. */
export function RangoValor({ v, compacto = false }) {
    if (!tieneValor(v))
        return _jsx("p", { className: "rango rango--vacio", children: "Valor a definir" });
    const pos = v.max > v.min ? ((v.mediana - v.min) / (v.max - v.min)) * 100 : 50;
    return (_jsxs("div", { className: `rango ${compacto ? 'rango--compacto' : ''}`, children: [_jsx("div", { className: "rango__barra", "aria-hidden": "true", children: _jsx("span", { className: "rango__mediana", style: { left: `${pos}%` } }) }), _jsxs("div", { className: "rango__nums mono", children: [_jsx("span", { children: fmt.moneda(v.min) }), _jsx("strong", { children: fmt.moneda(v.mediana) }), _jsx("span", { children: fmt.moneda(v.max) })] })] }));
}
