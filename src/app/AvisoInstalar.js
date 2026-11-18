import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MARCA } from '@/config/marca';
import { cerrarAviso, instalar, useInstalacion } from './instalar';
/** Tarjeta abajo de la pantalla que ofrece instalar la app como app. Se cierra y no vuelve por 30 días. */
export function AvisoInstalar() {
    const { modo, cerrado } = useInstalacion();
    if (!modo || cerrado)
        return null;
    return (_jsxs("aside", { className: "instalar", "aria-label": "Instalar la app", children: [_jsx("img", { className: "instalar__ico", src: "/icono-unisono-192.png", alt: "", width: 44, height: 44 }), _jsxs("div", { className: "instalar__txt", children: [_jsxs("strong", { children: ["Instal\u00E1 ", MARCA.nombre, " en tu ", modo === 'ios' ? 'celular' : 'equipo'] }), modo === 'nativo'
                        ? _jsx("span", { children: "Se abre como una app, en su propia ventana y con \u00EDcono en el inicio." })
                        : _jsxs("span", { children: ["Toc\u00E1 ", _jsx(IconoCompartir, {}), " ", _jsx("b", { children: "Compartir" }), " y despu\u00E9s ", _jsx("b", { children: "Agregar a inicio" }), "."] })] }), _jsxs("div", { className: "instalar__acc", children: [modo === 'nativo' && _jsx("button", { type: "button", className: "btn btn--pri btn--chico", onClick: () => { void instalar(); }, children: "Instalar" }), _jsx("button", { type: "button", className: "btn btn--ter btn--chico", onClick: cerrarAviso, children: modo === 'nativo' ? 'Ahora no' : 'Entendido' })] })] }));
}
function IconoCompartir() {
    return (_jsx("svg", { className: "instalar__compartir", viewBox: "0 0 24 24", width: 16, height: 16, "aria-hidden": "true", children: _jsx("path", { d: "M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" }) }));
}
