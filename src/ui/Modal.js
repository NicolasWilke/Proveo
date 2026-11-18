import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
export function Modal({ titulo, onCerrar, children, ancho = 560 }) {
    const ref = useRef(null);
    useEffect(() => {
        const tecla = (e) => e.key === 'Escape' && onCerrar();
        document.addEventListener('keydown', tecla);
        ref.current?.querySelector('textarea, input, select, button')?.focus();
        return () => document.removeEventListener('keydown', tecla);
    }, [onCerrar]);
    return (_jsx("div", { className: "modal", onMouseDown: (e) => e.target === e.currentTarget && onCerrar(), children: _jsxs("div", { className: "modal__caja", role: "dialog", "aria-modal": "true", "aria-label": titulo, style: { maxWidth: ancho }, ref: ref, children: [_jsxs("header", { className: "modal__cab", children: [_jsx("h2", { children: titulo }), _jsx("button", { className: "btn btn--icono", onClick: onCerrar, "aria-label": "Cerrar", children: "\u00D7" })] }), _jsx("div", { className: "modal__cuerpo", children: children })] }) }));
}
