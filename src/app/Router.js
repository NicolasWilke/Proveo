import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { EditarValores } from '@/features/admin/EditarValores';
import { Privacidad, Terminos } from '@/features/legal/Legal';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom';
import { Landing } from '@/features/landing/Landing';
import { Acceso } from '@/features/acceso/Acceso';
import { Unirse } from '@/features/acceso/Unirse';
import { MiPerfil } from '@/features/cuenta/MiPerfil';
import { Directorio } from '@/features/red/Directorio';
import { Perfil } from '@/features/red/Perfil';
import { Panel } from '@/features/panel/Panel';
import { Cotizaciones } from '@/features/cotizaciones/Cotizaciones';
import { DetallePedido } from '@/features/cotizaciones/DetallePedido';
import { NuevoPedido } from '@/features/cotizaciones/NuevoPedido';
import { ResumenEjecutivo } from '@/features/cotizaciones/ResumenEjecutivo';
import { IndicePrecios } from '@/features/precios/IndicePrecios';
import { Planes } from '@/features/planes/Planes';
import { Bandeja } from '@/features/mails/Bandeja';
import { ValoresReferencia } from '@/features/valores/ValoresReferencia';
import { Layout } from './Layout';
import { RequiereSesion } from './RequiereSesion';
import { ComprasRecientes } from '@/features/recientes/ComprasRecientes';
import { Referencias } from '@/features/referencias/Referencias';
import { EditarIndices } from '@/features/admin/EditarIndices';
import { Cuentas } from '@/features/admin/Cuentas';
/** Enlaces viejos a /registro?rol=… siguen funcionando. */
function RedirigirRegistro() {
    const [params] = useSearchParams();
    const rol = params.get('rol');
    return _jsx(Navigate, { to: `/ingresar?modo=registro${rol ? `&rol=${rol}` : ''}`, replace: true });
}
const rutas = (_jsxs(Route, { element: _jsx(Layout, {}), children: [_jsx(Route, { index: true, element: _jsx(Landing, {}) }), _jsx(Route, { path: "ingresar", element: _jsx(Acceso, {}) }), _jsx(Route, { path: "registro", element: _jsx(RedirigirRegistro, {}) }), _jsx(Route, { path: "unirse", element: _jsx(Unirse, {}) }), _jsx(Route, { path: "planes", element: _jsx(Planes, {}) }), _jsx(Route, { path: "terminos", element: _jsx(Terminos, {}) }), _jsx(Route, { path: "privacidad", element: _jsx(Privacidad, {}) }), _jsxs(Route, { element: _jsx(RequiereSesion, {}), children: [_jsx(Route, { path: "perfil", element: _jsx(MiPerfil, {}) }), _jsx(Route, { path: "panel", element: _jsx(Panel, {}) }), _jsx(Route, { path: "red", element: _jsx(Directorio, {}) }), _jsx(Route, { path: "red/:id", element: _jsx(Perfil, {}) }), _jsx(Route, { path: "cotizaciones", element: _jsx(Cotizaciones, {}) }), _jsx(Route, { path: "cotizaciones/nuevo", element: _jsx(NuevoPedido, {}) }), _jsx(Route, { path: "cotizaciones/:id", element: _jsx(DetallePedido, {}) }), _jsx(Route, { path: "cotizaciones/:id/resumen", element: _jsx(ResumenEjecutivo, {}) }), _jsx(Route, { path: "precios", element: _jsx(IndicePrecios, {}) }), _jsx(Route, { path: "mails", element: _jsx(Bandeja, {}) }), _jsx(Route, { path: "valores", element: _jsx(ValoresReferencia, {}) }), _jsx(Route, { path: "compras-recientes", element: _jsx(ComprasRecientes, {}) }), _jsx(Route, { path: "referencias", element: _jsx(Referencias, {}) }), _jsx(Route, { path: "admin", element: _jsx(Cuentas, {}) }), _jsx(Route, { path: "admin/cuentas", element: _jsx(Cuentas, {}) }), _jsx(Route, { path: "admin/indices", element: _jsx(EditarIndices, {}) }), _jsx(Route, { path: "admin/valores", element: _jsx(EditarValores, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Landing, {}) })] }));
// La demo publicada no puede cambiar la URL del visor: usa un router en memoria
// y acepta un ancla simple (#precios, #planes...) para abrir una sección.
const ANCLAS = {
    registro: '/ingresar?modo=registro', ingresar: '/ingresar', perfil: '/perfil', panel: '/panel', red: '/red', cotizaciones: '/cotizaciones', precios: '/precios', planes: '/planes', mails: '/mails', valores: '/valores',
};
export function AppRouter() {
    if (import.meta.env.VITE_ROUTER === 'memory') {
        const inicio = ANCLAS[window.location.hash.slice(1)] ?? '/';
        return _jsx(MemoryRouter, { initialEntries: [inicio], children: _jsx(Routes, { children: rutas }) });
    }
    return _jsx(BrowserRouter, { children: _jsx(Routes, { children: rutas }) });
}
