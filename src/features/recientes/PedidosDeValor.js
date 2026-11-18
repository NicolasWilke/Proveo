import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useSesion } from '@/app/session';
import { useQuery, useRepo } from '@/data/DataProvider';
import { venceEn } from '@/domain/antecedentes';
import { fmt } from '@/i18n';
import { Pill, Seccion } from '@/ui/primitivas';
import { useToast } from '@/ui/Toast';
/** Panel del proveedor: compradores que vieron una compra que ganó y le piden su valor vigente. */
export function PedidosDeValor() {
    const { usuarioId } = useSesion();
    const { data } = useQuery(async (r) => {
        const [sols, comps] = await Promise.all([r.solicitudesValor({ proveedorId: usuarioId }), r.listarCompradores()]);
        return { sols, comps };
    }, [usuarioId]);
    if (!data || !data.sols.length)
        return null;
    const pendientes = data.sols.filter((s) => s.estado === 'pendiente');
    const empresa = (id) => data.comps.find((c) => c.id === id)?.empresa ?? 'Un comprador de la red';
    return (_jsxs(Seccion, { titulo: "Pedidos de valor", extra: pendientes.length ? _jsxs(Pill, { tono: "senal", children: [pendientes.length, " por responder"] }) : undefined, children: [_jsx("p", { className: "tenue", children: "Te los mandan compradores que vieron en Compras recientes algo que ganaste. Tu precio adjudicado no lo vio nadie: inform\u00E1s el valor que quieras, solo a quien lo pidi\u00F3." }), _jsx("div", { className: "pila", children: data.sols.map((s) => _jsx(Pedido, { s: s, empresa: empresa(s.compradorId) }, s.id)) })] }));
}
function Pedido({ s, empresa }) {
    const repo = useRepo();
    const avisar = useToast();
    const [precio, setPrecio] = useState('');
    const [vigencia, setVigencia] = useState('');
    const [nota, setNota] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);
    const responder = async (r) => {
        setError('');
        setEnviando(true);
        try {
            await repo.responderValor(s.id, r);
            avisar(r ? `Le mandaste tu valor a ${empresa}.` : 'Listo, no se le informa ningún valor.');
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo responder.');
            setEnviando(false);
        }
    };
    return (_jsxs("article", { className: "solicitud", children: [_jsxs("div", { className: "solicitud__cab", children: [_jsxs("div", { children: [_jsx("strong", { children: s.nombre }), _jsxs("span", { className: "tenue bloque-linea", children: [empresa, " \u00B7 ", fmt.numero(s.cantidad), " ", s.unidad, " \u00B7 ", fmt.fecha(s.creada)] })] }), s.estado === 'pendiente'
                        ? _jsxs(Pill, { tono: "senal", children: ["Respond\u00E9 hasta el ", fmt.fecha(venceEn(s.creada))] })
                        : _jsx(Pill, { tono: s.estado === 'respondida' ? 'ok' : 'neutro', children: s.estado === 'respondida' ? 'Respondida' : 'No cotizaste' })] }), s.estado === 'respondida' && _jsxs("p", { className: "tenue", children: ["Informaste ", _jsx("strong", { className: "mono", children: fmt.moneda(s.precioUnitario) }), " sin IVA, vale hasta el ", fmt.fecha(s.vigencia), "."] }), s.mensaje && _jsx("blockquote", { className: "motivo", children: s.mensaje }), s.estado === 'pendiente' && (_jsxs("div", { className: "antecedente__form", children: [_jsxs("div", { className: "form__fila", children: [_jsxs("label", { className: "campo", htmlFor: `pv-${s.id}`, children: [_jsx("span", { children: "Valor unitario sin IVA" }), _jsx("input", { id: `pv-${s.id}`, type: "number", min: 0, value: precio, onChange: (e) => setPrecio(e.target.value) })] }), _jsxs("label", { className: "campo", htmlFor: `vg-${s.id}`, children: [_jsx("span", { children: "Vale hasta" }), _jsx("input", { id: `vg-${s.id}`, type: "date", value: vigencia, onChange: (e) => setVigencia(e.target.value) })] })] }), _jsxs("label", { className: "campo", htmlFor: `nt-${s.id}`, children: [_jsx("span", { children: "Nota (opcional)" }), _jsx("input", { id: `nt-${s.id}`, maxLength: 500, value: nota, onChange: (e) => setNota(e.target.value), placeholder: "Ej.: entrega en 5 d\u00EDas h\u00E1biles." })] }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsxs("div", { className: "form__acciones", children: [_jsx("button", { className: "btn btn--ter btn--chico", disabled: enviando, onClick: () => responder(null), children: "No cotizar" }), _jsx("button", { className: "btn btn--pri btn--chico", disabled: !(Number(precio) > 0) || !vigencia || enviando, onClick: () => responder({ precioUnitario: Number(precio), vigencia, nota }), children: "Enviar valor" })] })] }))] }));
}
