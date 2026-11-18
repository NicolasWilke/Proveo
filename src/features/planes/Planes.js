import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { evento } from '@/app/medicion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { useQuery, useRepo } from '@/data/DataProvider';
import { DESCUENTO_ANUAL, PLANES, precioMensual } from '@/domain/planes';
import { fmt } from '@/i18n';
import { Pill } from '@/ui/primitivas';
import { useToast } from '@/ui/Toast';
const DETALLE = {
    gratis: ['Perfil y vitrina', '3 solicitudes de contacto por mes', '3 respuestas a pedidos por mes', 'Reseñas de compradores'],
    pro: ['25 solicitudes de contacto por mes', 'Todos los pedidos de tu rubro, sin límite', 'Analítica del embudo', 'Lectura contra el índice al cotizar'],
    empresa: ['80 solicitudes de contacto por mes', 'Hasta 5 usuarios del equipo comercial', 'Varias regiones', 'Posición destacada en la red'],
};
export function Planes() {
    const { cuenta } = useAuth();
    const ir = useNavigate();
    const esProveedor = cuenta?.perfil.rol === 'proveedor';
    const repo = useRepo();
    const avisar = useToast();
    const [anual, setAnual] = useState(false);
    const esComprador = cuenta?.perfil.rol === 'comprador';
    const { data: enEspera } = useQuery((r) => (esComprador ? r.enListaEspera(cuenta.uid) : Promise.resolve(false)), [esComprador, cuenta?.uid]);
    const anotarse = async () => {
        if (!cuenta) {
            ir('/ingresar?modo=registro&rol=comprador');
            return;
        }
        if (!esComprador) {
            avisar('El plan Equipo es para compradores.', 'info');
            return;
        }
        try {
            await repo.sumarseListaEspera(cuenta.uid, cuenta.perfil.empresa);
            avisar('Te anotamos en la lista de espera del plan Equipo.', 'info');
        }
        catch {
            avisar('No pudimos anotarte. Probá de nuevo en un momento.', 'error');
        }
    };
    const { data: yo } = useQuery((r) => (esProveedor ? r.obtenerPersona(cuenta.uid) : Promise.resolve(null)), [esProveedor, cuenta?.uid]);
    const elegir = async (id) => {
        if (!cuenta) {
            ir('/ingresar?modo=registro&rol=proveedor');
            return;
        }
        if (cuenta.miembro) {
            avisar(`El plan lo cambia el titular de la cuenta de ${cuenta.perfil.empresa}.`, 'info');
            return;
        }
        if (!esProveedor) {
            avisar('Los planes pagos son para proveedores. Como comprador usás la red gratis.', 'info');
            return;
        }
        const resultado = await repo.cambiarPlan(cuenta.uid, id);
        evento('plan_pedido', { plan: id, anual });
        avisar(resultado === 'activo'
            ? `Plan ${PLANES[id].nombre} activo en ${cuenta.perfil.empresa}.`
            : `Recibimos tu pedido del plan ${PLANES[id].nombre}. Te escribimos para coordinar el pago y lo activamos.`, resultado === 'activo' ? 'ok' : 'info');
    };
    return (_jsxs("div", { className: "envoltura pagina", children: [_jsxs("header", { className: "pagina__cab", children: [_jsx("p", { className: "eyebrow", children: "Planes" }), _jsx("h1", { children: "Paga el proveedor. El comprador entra gratis, siempre." }), _jsx("p", { className: "tenue", children: "Precios de referencia en d\u00F3lares, facturados en pesos con ajuste trimestral. Sin comisi\u00F3n por negocio cerrado." })] }), _jsxs("div", { className: "segmento", role: "group", "aria-label": "Frecuencia de pago", children: [_jsx("button", { type: "button", "aria-pressed": !anual, className: !anual ? 'is-activo' : '', onClick: () => setAnual(false), children: "Mensual" }), _jsxs("button", { type: "button", "aria-pressed": anual, className: anual ? 'is-activo' : '', onClick: () => setAnual(true), children: ["Anual \u00B7 ", Math.round(DESCUENTO_ANUAL * 100), "% menos"] })] }), _jsx("h2", { className: "sub", children: "Proveedores" }), _jsx("div", { className: "planes", children: Object.keys(PLANES).map((id) => {
                    const p = PLANES[id];
                    const actual = yo?.plan === id;
                    return (_jsxs("article", { className: `plan ${id === 'pro' ? 'plan--clave' : ''}`, children: [_jsxs("header", { children: [_jsx("h3", { children: p.nombre }), id === 'pro' && _jsx(Pill, { tono: "sello", children: "Recomendado" })] }), _jsxs("p", { className: "plan__precio", children: [_jsx("span", { className: "mono", children: p.precioUsd ? fmt.usd(precioMensual(p, anual)) : 'USD 0' }), _jsx("span", { className: "tenue", children: "/mes" })] }), _jsx("ul", { className: "lista-check", children: DETALLE[id].map((d) => _jsx("li", { children: d }, d)) }), _jsx("button", { className: `btn ${id === 'pro' ? 'btn--pri' : 'btn--sec'}`, disabled: actual, onClick: () => elegir(id), children: actual ? 'Tu plan actual' : `Elegir ${p.nombre}` })] }, id));
                }) }), _jsx("h2", { className: "sub", children: "Compradores" }), _jsxs("div", { className: "planes planes--dos", children: [_jsxs("article", { className: "plan", children: [_jsx("header", { children: _jsx("h3", { children: "Comprador" }) }), _jsxs("p", { className: "plan__precio", children: [_jsx("span", { className: "mono", children: "Gratis" }), _jsx("span", { className: "tenue", children: " para siempre" })] }), _jsxs("ul", { className: "lista-check", children: [_jsx("li", { children: "Verificaci\u00F3n de perfil" }), _jsx("li", { children: "Pedidos de cotizaci\u00F3n ilimitados" }), _jsx("li", { children: "Comparador e \u00EDndice de precios" }), _jsx("li", { children: "Rese\u00F1as de proveedores" })] })] }), _jsxs("article", { className: "plan plan--proximo", children: [_jsxs("header", { children: [_jsx("h3", { children: "Equipo de compras" }), _jsx(Pill, { tono: "senal", children: "Pr\u00F3ximamente" })] }), _jsx("p", { className: "plan__precio", children: _jsx("span", { className: "tenue", children: "Para empresas medianas y grandes" }) }), _jsxs("ul", { className: "lista-check", children: [_jsx("li", { children: "Varios compradores en una cuenta" }), _jsx("li", { children: "Flujo de aprobaci\u00F3n" }), _jsx("li", { children: "Historial de proveedores" }), _jsx("li", { children: "Exportaci\u00F3n al ERP" })] }), enEspera
                                ? _jsx("p", { className: "tenue", children: "Ya est\u00E1s en la lista de espera. Te escribimos cuando est\u00E9 listo." })
                                : _jsx("button", { className: "btn btn--sec", onClick: anotarse, children: "Sumarme a la lista de espera" })] })] })] }));
}
