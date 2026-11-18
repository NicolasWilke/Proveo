import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useRepo } from '@/data/DataProvider';
import { MOTIVO_MAX, MOTIVO_MIN, cupoRestante } from '@/domain/reglas';
import { Modal } from '@/ui/Modal';
import { useToast } from '@/ui/Toast';
export function PedirContacto({ comprador, proveedorId, onCerrar }) {
    const repo = useRepo();
    const avisar = useToast();
    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);
    const { data } = useQuery(async (r) => ({ yo: (await r.obtenerPersona(proveedorId)), uso: await r.uso(proveedorId) }), [proveedorId]);
    const restante = data ? cupoRestante(data.yo.plan, data.uso).solicitudes : null;
    const nombre = comprador.semiAnonimo ? `${comprador.cargo} de ${comprador.empresa}` : `${comprador.nombre} ${comprador.apellido}`;
    const enviar = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError('');
        try {
            await repo.enviarSolicitud(proveedorId, comprador.id, motivo);
            avisar(`Solicitud enviada. ${comprador.semiAnonimo ? 'La persona' : comprador.nombre} la ve en su resumen y responde con un toque.`);
            onCerrar();
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setEnviando(false);
        }
    };
    return (_jsx(Modal, { titulo: `Pedir contacto a ${nombre}`, onCerrar: onCerrar, children: _jsxs("form", { onSubmit: enviar, className: "form", children: [_jsx("p", { className: "tenue", children: "Cont\u00E1 qu\u00E9 ofrec\u00E9s y por qu\u00E9 encaja con lo que est\u00E1 comprando. Si acepta, se liberan su mail y su tel\u00E9fono." }), _jsxs("label", { className: "campo", htmlFor: "motivo", children: [_jsx("span", { children: "Motivo" }), _jsx("textarea", { id: "motivo", rows: 5, maxLength: MOTIVO_MAX, value: motivo, onChange: (e) => setMotivo(e.target.value), placeholder: "Ej.: Tenemos 40 posiciones a \u221218 \u00B0C a 12 km de su planta y trabajamos con dos alimenticias del Litoral." }), _jsxs("span", { className: `contador mono ${motivo.trim().length < MOTIVO_MIN ? 'is-bajo' : ''}`, children: [motivo.length, "/", MOTIVO_MAX] })] }), _jsxs("p", { className: "nota", children: ["Acepta: ", _jsx("strong", { children: comprador.acepta }), ". No acepta: ", _jsx("strong", { children: comprador.noAcepta }), "."] }), restante !== null && (_jsxs("p", { className: "nota", children: ["Te quedan ", _jsx("strong", { children: restante }), " solicitudes este mes. ", restante <= 2 && _jsx(Link, { to: "/planes", onClick: onCerrar, children: "Ver planes con m\u00E1s cupo" })] })), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsxs("div", { className: "form__acciones", children: [_jsx("button", { type: "button", className: "btn btn--ter", onClick: onCerrar, children: "Cancelar" }), _jsx("button", { className: "btn btn--pri", disabled: enviando || motivo.trim().length < MOTIVO_MIN, children: "Enviar solicitud" })] })] }) }));
}
