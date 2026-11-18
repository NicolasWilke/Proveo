import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { vistaDePagina } from './medicion';
import { useRepo } from '@/data/DataProvider';
import { MARCA } from '@/config/marca';
import { REGION } from '@/config/region';
import { t } from '@/i18n';
import { useToast } from '@/ui/Toast';
import { useAuth } from '@/auth/AuthProvider';
import { AvisoInstalar } from './AvisoInstalar';
import { reabrirAviso, useInstalacion } from './instalar';
/** Íconos de trazo para la barra del celular (24×24, heredan el color del texto). */
const ICONOS = {
    inicio: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    planes: 'M4 6h16M4 12h16M4 18h10',
    panel: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    pedidos: 'M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1zM9 8h6M9 12h6',
    red: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 11a3 3 0 1 0 0-6M22 21a6 6 0 0 0-4-5.7',
    referencias: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
};
/** Las referencias (valores, índices, convenios, compras recientes) comparten una sola entrada. */
const REFERENCIAS = [
    { a: '/valores', texto: t.nav.valores },
    { a: '/precios', texto: t.nav.precios },
    { a: '/referencias', texto: t.nav.referencias, rol: 'comprador' },
    { a: '/compras-recientes', texto: t.nav.recientes, rol: 'comprador' },
];
const RUTAS_REF = REFERENCIAS.map((r) => r.a);
/** Cuatro entradas por rol; sin sesión, solo lo público. */
function navDe(rol) {
    if (!rol)
        return [
            { a: '/', texto: t.nav.inicio, fin: true, icono: 'inicio' },
            { a: '/planes', texto: t.nav.planes, icono: 'planes' },
        ];
    return [
        { a: '/panel', texto: 'Panel', icono: 'panel' },
        { a: '/cotizaciones', texto: 'Pedidos', icono: 'pedidos' },
        { a: '/red', texto: rol === 'comprador' ? 'Proveedores' : 'Compradores', icono: 'red' },
        { a: '/valores', texto: 'Referencias', icono: 'referencias', activo: RUTAS_REF },
    ];
}
/** Columnas del pie: solo páginas que existen; cambian según haya sesión y rol. */
function columnasPie(rol) {
    const producto = [{ a: '/', texto: t.nav.inicio }, { a: '/planes', texto: t.nav.planes }];
    const legal = { titulo: 'Legal', enlaces: [{ a: '/terminos', texto: 'Términos y condiciones' }, { a: '/privacidad', texto: 'Política de privacidad' }] };
    if (!rol)
        return [
            { titulo: 'Producto', enlaces: producto },
            { titulo: 'Empezá', enlaces: [
                    { a: '/ingresar?modo=registro&rol=comprador', texto: 'Quiero comprar' },
                    { a: '/ingresar?modo=registro&rol=proveedor', texto: 'Quiero vender' },
                    { a: '/ingresar', texto: 'Iniciar sesión' },
                ] },
            legal,
        ];
    return [
        { titulo: 'Producto', enlaces: producto },
        { titulo: 'Tu cuenta', enlaces: [
                { a: '/panel', texto: 'Panel' },
                rol === 'comprador' ? { a: '/cotizaciones/nuevo', texto: 'Nuevo pedido' } : { a: '/cotizaciones', texto: 'Para cotizar' },
                { a: '/red', texto: rol === 'comprador' ? 'Proveedores' : 'Compradores' },
                { a: '/perfil', texto: 'Mi perfil' },
            ] },
        { titulo: 'Referencias', enlaces: REFERENCIAS.filter((r) => !r.rol || r.rol === rol) },
        legal,
    ];
}
const iniciales = (empresa) => empresa.split(/\s+/).filter((w) => /^[A-ZÁÉÍÓÚÑ]/i.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
export function Layout() {
    const { auth, cuenta } = useAuth();
    const { pathname } = useLocation();
    const repo = useRepo();
    const avisar = useToast();
    const { modo: modoInstalar } = useInstalacion();
    const [menuAbierto, setMenuAbierto] = useState(false);
    useEffect(() => { window.scrollTo(0, 0); setMenuAbierto(false); vistaDePagina(pathname); }, [pathname]);
    useEffect(() => {
        if (!menuAbierto)
            return;
        const alTeclear = (e) => { if (e.key === 'Escape')
            setMenuAbierto(false); };
        window.addEventListener('keydown', alTeclear);
        return () => window.removeEventListener('keydown', alTeclear);
    }, [menuAbierto]);
    const rol = cuenta?.perfil.rol;
    const nav = navDe(rol);
    const clase = (n, base) => ({ isActive }) => `${base} ${isActive || n.activo?.some((r) => pathname.startsWith(r)) ? 'active' : ''}`;
    const enReferencias = !!rol && RUTAS_REF.some((r) => pathname.startsWith(r));
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: `cabecera ${cuenta ? 'cabecera--sesion' : ''}`, children: [_jsxs("div", { className: "cabecera__in envoltura", children: [_jsxs(NavLink, { to: "/", className: "marca", "aria-label": `${t.marca}, inicio`, children: [_jsx("img", { className: "marca__logo", src: MARCA.logo, alt: "", width: 50, height: 22 }), _jsxs("span", { className: "marca__txt", children: [_jsx("img", { className: "marca__nombre", src: MARCA.wordmark, alt: t.marca, width: 115, height: 24 }), _jsx("svg", { className: "marca__lema", viewBox: "0 0 115 21", width: 115, height: 21, "aria-hidden": "true", children: MARCA.lemaRenglones.map((r, i) => _jsx("text", { x: 0, y: 8 + i * 11, textLength: 115, lengthAdjust: "spacing", children: r }, r)) })] })] }), _jsx("nav", { className: "nav", "aria-label": "Principal", children: nav.map((n) => _jsx(NavLink, { to: n.a, end: n.fin, className: clase(n, 'nav__link'), children: n.texto }, n.a)) }), _jsx("div", { className: "cabecera__acc", children: cuenta ? (_jsx(_Fragment, { children: _jsxs(NavLink, { to: "/perfil", className: "usuario", "aria-label": `Mi perfil: ${cuenta.perfil.empresa}`, children: [cuenta.perfil.logoUrl
                                                ? _jsx("img", { className: "usuario__logo", src: cuenta.perfil.logoUrl, alt: "" })
                                                : _jsx("span", { className: "usuario__logo usuario__logo--ini", "aria-hidden": "true", children: iniciales(cuenta.perfil.empresa) }), _jsxs("span", { className: "usuario__txt", children: [cuenta.perfil.empresa, _jsx("small", { children: t.rol[cuenta.perfil.rol] })] })] }) })) : (_jsxs(_Fragment, { children: [_jsx(NavLink, { to: "/ingresar", className: "btn btn--sec btn--chico", children: "Iniciar sesi\u00F3n" }), _jsx(NavLink, { to: "/ingresar?modo=registro", className: "btn btn--pri btn--chico", children: "Registrarme" })] })) }), _jsx("button", { type: "button", className: "hamburguesa", "aria-label": menuAbierto ? 'Cerrar menú' : 'Abrir menú', "aria-expanded": menuAbierto, "aria-controls": "menu-chico", onClick: () => setMenuAbierto((v) => !v), children: _jsx("svg", { viewBox: "0 0 24 24", width: 24, height: 24, "aria-hidden": "true", children: _jsx("path", { d: menuAbierto ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16' }) }) })] }), menuAbierto && (_jsx("nav", { id: "menu-chico", className: "menu-chico", "aria-label": "Men\u00FA", children: _jsxs("div", { className: "envoltura", children: [nav.map((n) => _jsx(NavLink, { to: n.a, end: n.fin, className: clase(n, 'menu-chico__link'), children: n.texto }, n.a)), rol && REFERENCIAS.filter((r) => !r.rol || r.rol === rol).map((r) => _jsx(NavLink, { to: r.a, className: "menu-chico__link menu-chico__link--sub", children: r.texto }, r.a)), cuenta
                                    ? _jsx(NavLink, { to: "/perfil", className: "menu-chico__link", children: "Mi perfil" })
                                    : (_jsxs("div", { className: "menu-chico__acc", children: [_jsx(NavLink, { to: "/ingresar", className: "btn btn--sec", children: "Iniciar sesi\u00F3n" }), _jsx(NavLink, { to: "/ingresar?modo=registro", className: "btn btn--pri", children: "Registrarme" })] }))] }) }))] }), auth.modo === 'demo' && (_jsx("div", { className: "aviso-demo", children: _jsxs("div", { className: "envoltura", children: [_jsx("span", { children: t.demo.aviso }), _jsxs("span", { className: "aviso-demo__acc", children: [_jsx(NavLink, { to: "/mails", className: "enlace", children: "Mails enviados" }), _jsx("button", { type: "button", className: "enlace", onClick: async () => { await repo.reiniciarDemo(); if (cuenta)
                                        await repo.sincronizarCuenta({ ...cuenta.perfil, ...cuenta.contacto }); avisar('Demo reiniciada con los datos de ejemplo.', 'info'); }, children: t.demo.reiniciar })] })] }) })), enReferencias && (_jsx("nav", { className: "subnav envoltura", "aria-label": "Referencias", children: REFERENCIAS.filter((r) => !r.rol || r.rol === rol).map((r) => _jsx(NavLink, { to: r.a, className: "subnav__link", children: r.texto }, r.a)) })), _jsx("main", { className: "principal", children: _jsx(Outlet, {}) }), cuenta && (_jsx("nav", { className: "barra-movil", "aria-label": "Principal en el celular", children: nav.map((n) => (_jsxs(NavLink, { to: n.a, end: n.fin, className: clase(n, 'barra-movil__link'), children: [_jsx("svg", { className: "barra-movil__ico", viewBox: "0 0 24 24", width: 22, height: 22, "aria-hidden": "true", children: _jsx("path", { d: ICONOS[n.icono] }) }), n.texto] }, n.a))) })), _jsx(AvisoInstalar, {}), _jsx("footer", { className: "pie", children: _jsxs("div", { className: "envoltura", children: [_jsxs("div", { className: "pie__grilla", children: [_jsxs("div", { className: "pie__marca", children: [_jsxs(NavLink, { to: "/", className: "marca", "aria-label": `${t.marca}, inicio`, children: [_jsx("img", { className: "marca__logo", src: MARCA.logo, alt: "", width: 50, height: 22 }), _jsx("img", { className: "marca__nombre", src: MARCA.wordmark, alt: t.marca, width: 115, height: 24 })] }), _jsxs("p", { children: ["La red B2B de ", REGION.pais, " donde compradores y proveedores con nombre y apellido piden, comparan y adjudican cotizaciones en un solo lugar."] })] }), columnasPie(rol).map((c) => (_jsxs("nav", { className: "pie__col", "aria-label": c.titulo, children: [_jsx("h2", { className: "pie__titulo", children: c.titulo }), _jsx("ul", { children: c.enlaces.map((e) => _jsx("li", { children: _jsx(NavLink, { to: e.a, className: "pie__link", children: e.texto }) }, e.a)) })] }, c.titulo)))] }), _jsxs("p", { className: "pie__datos tenue", children: ["Datos personales tratados seg\u00FAn la ", REGION.leyDatos, ". Base registrada ante la ", REGION.autoridadDatos, ". Ning\u00FAn perfil se carga sin el consentimiento de su titular."] }), _jsxs("div", { className: "pie__base tenue", children: [_jsxs("span", { children: ["\u00A9 ", new Date().getFullYear(), " ", t.marca, ". ", MARCA.lema, MARCA.contacto && _jsxs(_Fragment, { children: [" \u00B7 ", _jsx("a", { className: "pie__link", href: `mailto:${MARCA.contacto}`, children: MARCA.contacto })] }), modoInstalar && _jsxs(_Fragment, { children: [" \u00B7 ", _jsx("button", { type: "button", className: "pie__link pie__boton", onClick: reabrirAviso, children: "Instalar la app" })] })] }), _jsxs("span", { className: "mono", children: ["v0.1 \u00B7 ", auth.modo === 'firebase' ? `Firebase · ${import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'sin proyecto'}` : 'modo demo'] })] })] }) })] }));
}
