import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useRepo } from '@/data/DataProvider';
import { PREGUNTA_MAX, PREGUNTA_MIN, RESPUESTA_MAX, puedeCotizar, recibeOfertas } from '@/domain/rfq';
import { fmt } from '@/i18n';
import { Pill, Seccion } from '@/ui/primitivas';
import { useToast } from '@/ui/Toast';
/**
 * Preguntas y respuestas del pedido. Son públicas para todos los que pueden verlo y anónimas:
 * nadie, ni el comprador, sabe qué proveedor preguntó.
 */
export function Consultas({ pedido, rol, usuarioId, esDueno }) {
    const { data: consultas = [] } = useQuery((r) => r.consultasDe(pedido.id), [pedido.id]);
    const abierto = recibeOfertas(pedido);
    const puedePreguntar = rol === 'proveedor' && abierto && puedeCotizar(pedido, usuarioId);
    const pendientes = consultas.filter((c) => !c.respuesta).length;
    if (!consultas.length && !puedePreguntar && !esDueno)
        return null;
    return (_jsxs(Seccion, { titulo: `Consultas · ${consultas.length}`, extra: esDueno && pendientes > 0 ? _jsxs(Pill, { tono: "senal", children: [pendientes, " sin responder"] }) : undefined, children: [_jsx("p", { className: "tenue", children: "Las preguntas y respuestas las ven todos los proveedores del pedido. Nadie ve qui\u00E9n pregunt\u00F3." }), consultas.length === 0 && _jsx("p", { className: "tenue", children: "Todav\u00EDa no hay consultas." }), consultas.length > 0 && (_jsx("ol", { className: "consultas", children: consultas.map((c) => _jsx(Item, { c: c, pedidoId: pedido.id, puedeResponder: esDueno }, c.id)) })), puedePreguntar && _jsx(Preguntar, { pedido: pedido, usuarioId: usuarioId }), rol === 'proveedor' && !abierto && _jsx("p", { className: "tenue", children: "El pedido cerr\u00F3: ya no se pueden hacer consultas." })] }));
}
function Item({ c, pedidoId, puedeResponder }) {
    const repo = useRepo();
    const avisar = useToast();
    const [texto, setTexto] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);
    const responder = async () => {
        setError('');
        setEnviando(true);
        try {
            await repo.responderConsulta(pedidoId, c.id, texto);
            avisar('Respuesta publicada. La ven todos los proveedores del pedido.');
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo responder.');
        }
        finally {
            setEnviando(false);
        }
    };
    return (_jsxs("li", { className: "consulta", children: [_jsxs("p", { className: "consulta__p", children: [_jsx("span", { className: "consulta__etq", children: "Pregunta" }), c.pregunta, " ", _jsxs("span", { className: "tenue", children: ["\u00B7 ", fmt.fecha(c.creada)] })] }), c.respuesta
                ? _jsxs("p", { className: "consulta__r", children: [_jsx("span", { className: "consulta__etq", children: "Respuesta" }), c.respuesta, " ", _jsxs("span", { className: "tenue", children: ["\u00B7 ", fmt.fecha(c.respondida)] })] })
                : puedeResponder
                    ? (_jsxs("div", { className: "consulta__form", children: [_jsxs("label", { className: "campo", htmlFor: `resp-${c.id}`, children: [_jsx("span", { children: "Tu respuesta (la ven todos los proveedores)" }), _jsx("textarea", { id: `resp-${c.id}`, rows: 2, maxLength: RESPUESTA_MAX, value: texto, onChange: (e) => setTexto(e.target.value) })] }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsx("button", { className: "btn btn--sec btn--chico", disabled: !texto.trim() || enviando, onClick: responder, children: enviando ? 'Publicando…' : 'Responder' })] }))
                    : _jsx("p", { className: "consulta__r tenue", children: "Sin respuesta todav\u00EDa." })] }));
}
function Preguntar({ pedido, usuarioId }) {
    const repo = useRepo();
    const avisar = useToast();
    const [texto, setTexto] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);
    const largo = texto.trim().length;
    const enviar = async () => {
        setError('');
        setEnviando(true);
        try {
            await repo.preguntar(pedido.id, texto, usuarioId);
            setTexto('');
            avisar('Consulta enviada. Sale sin tu nombre.');
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo enviar la consulta.');
        }
        finally {
            setEnviando(false);
        }
    };
    return (_jsxs("div", { className: "consulta__form", children: [_jsxs("label", { className: "campo", htmlFor: "consulta-nueva", children: [_jsx("span", { children: "Hac\u00E9 una consulta (sale sin tu nombre)" }), _jsx("textarea", { id: "consulta-nueva", rows: 2, maxLength: PREGUNTA_MAX, value: texto, onChange: (e) => setTexto(e.target.value), placeholder: "Ej.: \u00BFAceptan entregas parciales?" })] }), _jsx("p", { className: "tenue", children: largo < PREGUNTA_MIN ? `Mínimo ${PREGUNTA_MIN} caracteres.` : `${largo} de ${PREGUNTA_MAX}` }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsx("button", { className: "btn btn--sec btn--chico", disabled: largo < PREGUNTA_MIN || enviando, onClick: enviar, children: enviando ? 'Enviando…' : 'Enviar consulta' })] }));
}
