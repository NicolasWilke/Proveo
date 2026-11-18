import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSesion } from '@/app/session';
import { useQuery } from '@/data/DataProvider';
import { REGIONES, region, rubro } from '@/domain/catalogos';
import { FiltroRubro } from '@/ui/rubros';
import { COMPARAR_MAX, ordenar, promedioPonderado, reputacionVisible } from '@/domain/directorio';
import { Seccion, Vacio } from '@/ui/primitivas';
import { Insignias, Reputacion, TarjetaComprador, TarjetaProveedor } from './TarjetaProveedor';
const LISTAS = { todos: 'Toda la red', favoritos: 'Solo mis favoritos', cotizaron: 'Ya me cotizaron', adjudique: 'Les adjudiqué' };
const ORDENES = { relevancia: 'Relevancia', calificacion: 'Mejor calificados', resenas: 'Más reseñas', antiguedad: 'Más trayectoria' };
export function Directorio() {
    const { rol, usuarioId } = useSesion();
    const ir = useNavigate();
    const [pestana, setPestana] = useState(rol === 'proveedor' ? 'compradores' : 'proveedores');
    const [filtro, setFiltro] = useState({});
    const [minimo, setMinimo] = useState(0);
    const [conCert, setConCert] = useState(false);
    const [lista, setLista] = useState('todos');
    const [orden, setOrden] = useState('relevancia');
    const [seleccion, setSeleccion] = useState([]);
    const [comparando, setComparando] = useState(false);
    const { data } = useQuery((r) => pestana === 'compradores' ? r.listarCompradores(filtro) : r.listarProveedores(filtro), [pestana, JSON.stringify(filtro)]);
    // Sin filtros: solo para saber qué rubros tienen gente y mostrarlos como chips.
    const { data: todos } = useQuery((r) => pestana === 'compradores' ? r.listarCompradores({}) : r.listarProveedores({}), [pestana]);
    // Las listas propias del comprador: favoritos, quién le cotizó y a quién le adjudicó. Sin precios.
    const { data: mias } = useQuery(async (r) => {
        if (rol !== 'comprador')
            return null;
        const [favoritos, pedidos] = await Promise.all([r.favoritos(usuarioId), r.listarPedidos({ compradorId: usuarioId, visorId: usuarioId })]);
        const cotis = await Promise.all(pedidos.map((p) => r.cotizacionesDe(p.id).catch(() => [])));
        return {
            favoritos: new Set(favoritos),
            cotizaron: new Set(cotis.flat().map((c) => c.proveedorId)),
            adjudique: new Set(pedidos.flatMap((p) => p.adjudicados ?? (p.adjudicadaA ? [p.adjudicadaA] : []))),
        };
    }, [rol, usuarioId]);
    const esComprador = rol === 'comprador' && pestana === 'proveedores';
    let resultados = data ?? [];
    if (pestana === 'proveedores') {
        let provs = resultados;
        if (minimo)
            provs = provs.filter((p) => reputacionVisible(p) && promedioPonderado(p) >= minimo);
        if (conCert)
            provs = provs.filter((p) => p.certificaciones.length > 0);
        if (lista !== 'todos' && mias)
            provs = provs.filter((p) => mias[lista].has(p.id));
        resultados = ordenar(provs, orden, filtro.rubro);
    }
    const elegidos = (data ?? []).filter((p) => p.rol === 'proveedor' && seleccion.includes(p.id));
    const alternar = (id, si) => setSeleccion(si ? [...seleccion, id] : seleccion.filter((x) => x !== id));
    return (_jsxs("div", { className: "envoltura pagina", children: [_jsxs("header", { className: "pagina__cab", children: [_jsx("p", { className: "eyebrow", children: "La red" }), _jsx("h1", { children: "Personas con nombre y apellido, empresas con CUIT" })] }), _jsx("div", { className: "pestanas", role: "tablist", children: ['proveedores', 'compradores'].map((p) => (_jsx("button", { role: "tab", "aria-selected": pestana === p, className: pestana === p ? 'is-activa' : '', onClick: () => setPestana(p), children: p === 'proveedores' ? 'Proveedores' : 'Compradores' }, p))) }), _jsxs("div", { className: "filtros", children: [_jsxs("label", { className: "campo campo--inline", htmlFor: "buscar", children: [_jsx("span", { children: "Buscar" }), _jsx("input", { id: "buscar", type: "search", placeholder: "Nombre, empresa, ciudad o producto", value: filtro.texto ?? '', onChange: (e) => setFiltro({ ...filtro, texto: e.target.value }) })] }), _jsxs("label", { className: "campo campo--inline", htmlFor: "f-region", children: [_jsx("span", { children: "Regi\u00F3n" }), _jsxs("select", { id: "f-region", value: filtro.region ?? '', onChange: (e) => setFiltro({ ...filtro, region: (e.target.value || undefined) }), children: [_jsx("option", { value: "", children: "Todas" }), REGIONES.map((r) => _jsx("option", { value: r.id, children: r.nombre }, r.id))] })] }), pestana === 'proveedores' && (_jsxs(_Fragment, { children: [_jsxs("label", { className: "campo campo--inline", htmlFor: "f-min", children: [_jsx("span", { children: "Calificaci\u00F3n" }), _jsxs("select", { id: "f-min", value: minimo, onChange: (e) => setMinimo(Number(e.target.value)), children: [_jsx("option", { value: 0, children: "Cualquiera" }), _jsx("option", { value: 4, children: "4 o m\u00E1s" }), _jsx("option", { value: 3, children: "3 o m\u00E1s" })] })] }), _jsxs("label", { className: "campo campo--inline", htmlFor: "f-orden", children: [_jsx("span", { children: "Ordenar por" }), _jsx("select", { id: "f-orden", value: orden, onChange: (e) => setOrden(e.target.value), children: Object.keys(ORDENES).map((o) => _jsx("option", { value: o, children: ORDENES[o] }, o)) })] }), _jsxs("label", { className: "opcion opcion--inline", children: [_jsx("input", { type: "checkbox", checked: conCert, onChange: (e) => setConCert(e.target.checked) }), _jsx("span", { children: "Con certificaciones" })] })] })), pestana === 'compradores' && (_jsxs("label", { className: "opcion opcion--inline", children: [_jsx("input", { type: "checkbox", checked: !!filtro.soloVentanaAbierta, onChange: (e) => setFiltro({ ...filtro, soloVentanaAbierta: e.target.checked }) }), _jsx("span", { children: "Solo con ventana de compra abierta" })] }))] }), esComprador && (_jsx("div", { className: "segmento", role: "group", "aria-label": "Mis listas", children: Object.keys(LISTAS).map((l) => _jsx("button", { type: "button", "aria-pressed": lista === l, className: lista === l ? 'is-activo' : '', onClick: () => setLista(l), children: LISTAS[l] }, l)) })), _jsx(FiltroRubro, { id: "dir-rubro", valor: filtro.rubro, onCambio: (r) => setFiltro({ ...filtro, rubro: r }), conDatos: (todos ?? []).flatMap((p) => p.rubros) }), data && resultados.length === 0 && _jsx(Vacio, { titulo: "No hay resultados con esos filtros", children: "Prob\u00E1 con otra regi\u00F3n, otra calificaci\u00F3n o con todos los rubros." }), _jsx("div", { className: "grilla-3", children: resultados.map((p) => p.rol === 'comprador'
                    ? _jsx(TarjetaComprador, { c: p, oculto: p.semiAnonimo }, p.id)
                    : _jsx(TarjetaProveedor, { p: p, seleccionado: seleccion.includes(p.id), onSeleccionar: esComprador ? (si) => alternar(p.id, si) : undefined }, p.id)) }), esComprador && seleccion.length > 0 && (_jsxs("div", { className: "barra-seleccion", role: "region", "aria-label": "Proveedores seleccionados", children: [_jsxs("span", { children: [_jsx("strong", { children: seleccion.length }), " ", seleccion.length === 1 ? 'seleccionado' : 'seleccionados'] }), _jsx("button", { className: "btn btn--sec btn--chico", disabled: seleccion.length < 2 || seleccion.length > COMPARAR_MAX, title: `De 2 a ${COMPARAR_MAX} proveedores`, onClick: () => setComparando(true), children: "Comparar" }), _jsx("button", { className: "btn btn--pri btn--chico", onClick: () => ir(`/cotizaciones/nuevo?invitar=${seleccion.join(',')}`), children: "Invitar a un pedido privado" }), _jsx("button", { className: "btn btn--ter btn--chico", onClick: () => setSeleccion([]), children: "Limpiar" })] })), comparando && elegidos.length >= 2 && _jsx(Comparar, { provs: elegidos, onCerrar: () => setComparando(false) })] }));
}
/** Lado a lado, hasta 4: solo datos públicos del perfil y reputación. Nunca precios de otras cotizaciones. */
function Comparar({ provs, onCerrar }) {
    const filas = [
        ['Calificación', (p) => _jsx(Reputacion, { p: p })],
        ['Insignias', (p) => _jsx(Insignias, { p: p })],
        ['Rubros', (p) => p.rubros.map((r) => rubro(r).nombre).join(', ')],
        ['Ubicación', (p) => `${p.ciudad} · ${region(p.region).nombre}`],
        ['Cobertura', (p) => REGIONES.filter((r) => (p.cobertura[r.id] ?? 0) > 0).map((r) => `${r.nombre} ${p.cobertura[r.id]}%`).join(', ') || '—'],
        ['En actividad desde', (p) => p.desde],
        ['Empleados', (p) => p.empleados || '—'],
        ['Certificaciones', (p) => p.certificaciones.join(', ') || '—'],
    ];
    return (_jsx(Seccion, { titulo: `Comparación · ${provs.length} proveedores`, extra: _jsx("button", { className: "btn btn--ter btn--chico", onClick: onCerrar, children: "Cerrar" }), children: _jsx("div", { className: "tabla-envoltura", children: _jsxs("table", { className: "tabla tabla--comparar", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { scope: "col" }), provs.map((p) => _jsx("th", { scope: "col", children: _jsx(Link, { className: "tabla__tit", to: `/red/${p.id}`, children: p.empresa }) }, p.id))] }) }), _jsx("tbody", { children: filas.map(([k, f]) => _jsxs("tr", { children: [_jsx("th", { scope: "row", children: k }), provs.map((p) => _jsx("td", { children: f(p) }, p.id))] }, k)) })] }) }) }));
}
