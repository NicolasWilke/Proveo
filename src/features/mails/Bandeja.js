import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery, useRepo } from '@/data/DataProvider';
import { HORA_RESUMEN } from '@/domain/notificaciones';
import { Pill, Vacio } from '@/ui/primitivas';
import { useToast } from '@/ui/Toast';
/** Solo demo: muestra lo que el servidor mandaría por mail. En producción esto lo registra el proveedor de mail. */
export function Bandeja() {
    const repo = useRepo();
    const avisar = useToast();
    const { data } = useQuery((r) => r.bandejaSalida(), []);
    const [sel, setSel] = useState(null);
    if (!data)
        return _jsx("div", { className: "envoltura pagina" });
    const actual = data.find((m) => m.id === sel) ?? data[0];
    const enCola = data.filter((m) => m.estado === 'en-cola').length;
    return (_jsxs("div", { className: "envoltura pagina", children: [_jsxs("header", { className: "pagina__cab pagina__cab--fila", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Demo \u00B7 mails a proveedores" }), _jsx("h1", { children: "Lo que reciben los proveedores cuando se publica un pedido" }), _jsx("p", { className: "tenue", children: "En la demo no sale ning\u00FAn mail. Cada pedido nuevo genera un aviso para los proveedores verificados de ese rubro, seg\u00FAn c\u00F3mo eligi\u00F3 recibirlos." })] }), enCola > 0 && (_jsxs("button", { className: "btn btn--sec", onClick: async () => { const n = await repo.enviarResumenesAhora(); avisar(`Se enviaron ${n} ${n === 1 ? 'resumen' : 'resúmenes'} diarios.`); }, children: ["Enviar los res\u00FAmenes de las ", HORA_RESUMEN, " ahora"] }))] }), data.length === 0 && _jsx(Vacio, { titulo: "Todav\u00EDa no hay mails", accion: { a: '/cotizaciones', texto: 'Publicar un pedido como comprador' }, children: "Public\u00E1 un pedido desde el rol comprador y volv\u00E9 ac\u00E1." }), actual && (_jsxs("div", { className: "bandeja", children: [_jsx("ul", { className: "bandeja__lista", "aria-label": "Mails", children: data.map((m) => (_jsx("li", { children: _jsxs("button", { type: "button", className: m.id === actual.id ? 'is-sel' : '', onClick: () => setSel(m.id), children: [_jsx("span", { className: "bandeja__para", children: m.para.nombre }), _jsx("span", { className: "bandeja__asunto", children: m.asunto }), _jsxs("span", { className: "bandeja__meta", children: [_jsx(Pill, { tono: m.estado === 'enviado' ? 'ok' : 'senal', children: m.estado === 'enviado' ? 'Enviado' : `Sale a las ${HORA_RESUMEN}` }), _jsx("span", { className: "tenue", children: m.tipo === 'resumen' ? 'Resumen diario' : 'Mail por pedido' })] })] }) }, m.id))) }), _jsxs("article", { className: "bandeja__vista", children: [_jsxs("dl", { className: "bandeja__cab", children: [_jsxs("div", { children: [_jsx("dt", { children: "Para" }), _jsxs("dd", { children: [actual.para.nombre, " ", _jsxs("span", { className: "mono tenue", children: ["<", actual.para.email, ">"] })] })] }), _jsxs("div", { children: [_jsx("dt", { children: "Asunto" }), _jsx("dd", { children: _jsx("strong", { children: actual.asunto }) })] })] }), _jsx("div", { className: "bandeja__html", dangerouslySetInnerHTML: { __html: actual.html } })] })] }))] }));
}
