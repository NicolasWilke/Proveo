import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ENLACES_MAX, urlValida } from '@/domain/rfq';
/** Archivos compartidos como enlace: el plan gratuito de Firebase no guarda archivos. */
export function EditorEnlaces({ valor, onCambio, id, ayuda }) {
    const [nombre, setNombre] = useState('');
    const [url, setUrl] = useState('');
    const valido = nombre.trim().length > 0 && urlValida(url);
    const sumar = () => {
        if (!valido)
            return;
        onCambio([...valor, { nombre: nombre.trim(), url: url.trim() }]);
        setNombre('');
        setUrl('');
    };
    return (_jsxs("fieldset", { className: "campo", children: [_jsx("legend", { children: "Archivos como enlace (opcional)" }), _jsx("span", { className: "tenue", children: ayuda }), valor.length > 0 && _jsx(ListaEnlaces, { enlaces: valor, onQuitar: (i) => onCambio(valor.filter((_, n) => n !== i)) }), valor.length < ENLACES_MAX && (_jsxs("div", { className: "enlaces__nuevo", children: [_jsx("input", { "aria-label": "Nombre del archivo", id: `${id}-nombre`, value: nombre, onChange: (e) => setNombre(e.target.value), placeholder: "Ej.: Plano de planta" }), _jsx("input", { "aria-label": "Enlace", id: `${id}-url`, value: url, onChange: (e) => setUrl(e.target.value), placeholder: "https://drive.google.com/\u2026", onKeyDown: (e) => { if (e.key === 'Enter') {
                            e.preventDefault();
                            sumar();
                        } } }), _jsx("button", { type: "button", className: "btn btn--sec btn--chico", disabled: !valido, onClick: sumar, children: "Agregar" })] })), url && !urlValida(url) && _jsx("span", { className: "error", children: "El enlace tiene que empezar con https://" })] }));
}
export function ListaEnlaces({ enlaces, onQuitar }) {
    return (_jsx("ul", { className: "enlaces", children: enlaces.map((e, i) => (_jsxs("li", { children: [_jsx("a", { href: e.url, target: "_blank", rel: "noopener noreferrer", children: e.nombre }), onQuitar && _jsx("button", { type: "button", className: "enlace", onClick: () => onQuitar(i), "aria-label": `Quitar ${e.nombre}`, children: "Quitar" })] }, `${e.url}-${i}`))) }));
}
