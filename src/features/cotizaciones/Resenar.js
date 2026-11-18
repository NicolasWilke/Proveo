import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useRepo } from '@/data/DataProvider';
import { RESENA_TEXTO } from '@/domain/resenas';
import { fmt } from '@/i18n';
import { Estrellas, Seccion } from '@/ui/primitivas';
import { useToast } from '@/ui/Toast';
const CRITERIOS = [['entrega', 'Entrega'], ['calidad', 'Calidad'], ['facturacion', 'Facturación']];
function Puntaje({ etiqueta, valor, onCambio }) {
    return (_jsxs("div", { className: "puntaje", role: "radiogroup", "aria-label": etiqueta, children: [_jsx("span", { children: etiqueta }), [1, 2, 3, 4, 5].map((n) => (_jsx("button", { type: "button", role: "radio", "aria-checked": valor === n, "aria-label": `${n} de 5`, className: `puntaje__estrella ${n <= valor ? 'is-on' : ''}`, onClick: () => onCambio(n), children: "\u2605" }, n)))] }));
}
/** El comprador califica a cada proveedor que ganó su pedido. Una reseña por proveedor, sin edición posterior. */
export function Resenar({ pedidoId, proveedorId, empresa, resena }) {
    const repo = useRepo();
    const avisar = useToast();
    const [d, setD] = useState({ entrega: 0, calidad: 0, facturacion: 0, texto: '' });
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);
    if (resena) {
        return (_jsx(Seccion, { titulo: `Tu reseña de ${empresa}`, children: _jsxs("figure", { className: "resena", children: [_jsx(Estrellas, { valor: (resena.entrega + resena.calidad + resena.facturacion) / 3 }), _jsx("blockquote", { children: resena.texto }), _jsxs("figcaption", { className: "tenue", children: ["Entrega ", resena.entrega, " \u00B7 Calidad ", resena.calidad, " \u00B7 Facturaci\u00F3n ", resena.facturacion, " \u00B7 ", fmt.fecha(resena.fecha)] })] }) }));
    }
    const enviar = async () => {
        setError('');
        setEnviando(true);
        try {
            await repo.resenar(pedidoId, proveedorId, d);
            avisar(`Gracias. Tu reseña ya aparece en el perfil de ${empresa.replace(/\.$/, '')}.`);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo guardar la reseña.');
        }
        finally {
            setEnviando(false);
        }
    };
    return (_jsxs(Seccion, { titulo: `Calificá a ${empresa}`, children: [_jsx("p", { className: "tenue", children: "Se publica en su perfil con tu nombre y empresa. Es una sola por pedido y proveedor, y no se puede editar." }), _jsx("div", { className: "puntajes", children: CRITERIOS.map(([k, txt]) => _jsx(Puntaje, { etiqueta: txt, valor: d[k], onCambio: (n) => setD({ ...d, [k]: n }) }, k)) }), _jsxs("label", { className: "campo", htmlFor: "resena-texto", children: [_jsxs("span", { children: ["Comentario (", d.texto.trim().length, "/", RESENA_TEXTO.max, ")"] }), _jsx("textarea", { id: "resena-texto", rows: 3, maxLength: RESENA_TEXTO.max, value: d.texto, onChange: (e) => setD({ ...d, texto: e.target.value }), placeholder: "C\u00F3mo fue la entrega, la calidad y la facturaci\u00F3n." })] }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsx("button", { className: "btn btn--pri", disabled: enviando, onClick: enviar, children: "Publicar rese\u00F1a" })] }));
}
