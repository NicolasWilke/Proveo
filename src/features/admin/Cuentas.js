import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { useQuery, useRepo } from '@/data/DataProvider';
import { PLANES } from '@/domain/planes';
import { Pill, Seccion, Vacio } from '@/ui/primitivas';
import { useToast } from '@/ui/Toast';
import { MARCA } from '@/config/marca';
const fechaCorta = (iso) => iso.split('-').reverse().join('/');
const errorDe = (e) => (e instanceof Error ? e.message : 'No se pudo guardar.');
/**
 * Panel del equipo: pedidos de plan, plan vigente y verificación de cada cuenta. Reemplaza a
 * `npm run admin -- plan|verificar|pendientes`. El cobro sigue por fuera: se activa el plan después de cobrar.
 */
export function Cuentas() {
    const { cuenta } = useAuth();
    const [texto, setTexto] = useState('');
    const [rol, setRol] = useState('proveedor');
    const { data, cargando, error } = useQuery(async (r) => {
        const admin = await r.esAdmin(cuenta.uid);
        if (!admin)
            return { admin, cuentas: [], espera: null };
        // Con las reglas viejas publicadas, la lista de espera no se lee: el resto del panel sigue andando.
        const [cuentas, espera] = await Promise.all([r.cuentasAdmin(), r.listaEspera().catch(() => null)]);
        return { admin, cuentas, espera };
    }, [cuenta?.uid]);
    if (error) {
        return (_jsx("div", { className: "envoltura pagina", children: _jsxs(Vacio, { titulo: "No se pudieron leer las cuentas", accion: { a: '/panel', texto: 'Volver al panel' }, children: ["Tu usuario figura en admins, pero Firestore rechaz\u00F3 la lectura. Lo m\u00E1s com\u00FAn: esta cuenta no tiene perfil en la red (users/", cuenta?.uid, ") o las reglas publicadas son viejas. Detalle: ", error.message] }) }));
    }
    if (cargando || !data)
        return _jsx("div", { className: "envoltura pagina" });
    if (!data.admin) {
        return (_jsx("div", { className: "envoltura pagina", children: _jsx(Vacio, { titulo: `Solo para el equipo de ${MARCA.nombre}`, accion: { a: '/panel', texto: 'Volver al panel' }, children: "Para administrar cuentas, tu usuario tiene que figurar en la colecci\u00F3n admins de Firestore." }) }));
    }
    const pendientes = data.cuentas.filter((c) => c.pedido);
    const q = texto.trim().toLowerCase();
    const lista = data.cuentas.filter((c) => (!rol || c.rol === rol)
        && (!q || `${c.empresa} ${c.contactoNombre} ${c.email} ${c.cuit}`.toLowerCase().includes(q)));
    return (_jsxs("div", { className: "envoltura pagina", children: [_jsxs("header", { className: "pagina__cab", children: [_jsx("p", { className: "eyebrow", children: "Administraci\u00F3n" }), _jsx("h1", { children: "Cuentas y planes" }), _jsx("p", { className: "tenue", children: "Activ\u00E1 el plan despu\u00E9s de confirmar el cobro. El cambio se aplica enseguida, sin que el usuario tenga que hacer nada." })] }), _jsxs("nav", { className: "acciones-sol", children: [_jsx(Link, { className: "btn btn--ter btn--chico", to: "/admin/valores", children: "Valores de referencia" }), _jsx(Link, { className: "btn btn--ter btn--chico", to: "/admin/indices", children: "\u00CDndices y convenios" })] }), _jsx(Seccion, { titulo: `Pedidos de plan${pendientes.length ? ` · ${pendientes.length}` : ''}`, children: pendientes.length === 0
                    ? _jsx("p", { className: "tenue", children: "No hay pedidos sin atender." })
                    : _jsx("ul", { className: "admin-cuentas", children: pendientes.map((c) => _jsx(Pendiente, { c: c }, c.id)) }) }), _jsx(Seccion, { titulo: `Lista de espera del plan Equipo${data.espera?.length ? ` · ${data.espera.length}` : ''}`, children: data.espera === null
                    ? _jsx("p", { className: "tenue", children: "No se pudo leer. Public\u00E1 las reglas nuevas de Firestore (firebase/firestore.rules)." })
                    : data.espera.length === 0
                        ? _jsx("p", { className: "tenue", children: "Todav\u00EDa no se anot\u00F3 ning\u00FAn comprador." })
                        : _jsx("ul", { className: "admin-cuentas", children: data.espera.map((e) => _jsxs("li", { children: [_jsx("strong", { children: e.empresa }), " ", _jsxs("span", { className: "tenue", children: ["\u00B7 se anot\u00F3 el ", fechaCorta(e.anotado)] })] }, e.uid)) }) }), _jsxs(Seccion, { titulo: "Todas las cuentas", children: [_jsxs("div", { className: "form__fila", children: [_jsxs("label", { className: "campo campo--inline", htmlFor: "ad-buscar", children: [_jsx("span", { children: "Buscar" }), _jsx("input", { id: "ad-buscar", placeholder: "Empresa, contacto, mail o CUIT", value: texto, onChange: (e) => setTexto(e.target.value) })] }), _jsxs("label", { className: "campo campo--inline", htmlFor: "ad-rol", children: [_jsx("span", { children: "Tipo" }), _jsxs("select", { id: "ad-rol", value: rol, onChange: (e) => setRol(e.target.value), children: [_jsx("option", { value: "proveedor", children: "Proveedores" }), _jsx("option", { value: "comprador", children: "Compradores" }), _jsx("option", { value: "", children: "Todas" })] })] })] }), lista.length === 0
                        ? _jsx("p", { className: "tenue", children: "No hay cuentas con ese filtro." })
                        : _jsx("ul", { className: "admin-cuentas", children: lista.map((c) => _jsx(Fila, { c: c }, c.id)) })] })] }));
}
function Datos({ c }) {
    return (_jsxs("div", { className: "admin-cuentas__datos", children: [_jsx("strong", { children: c.empresa }), _jsxs("span", { className: "tenue", children: [c.contactoNombre, c.email && _jsxs(_Fragment, { children: [" \u00B7 ", _jsx("a", { href: `mailto:${c.email}`, children: c.email })] })] }), _jsx("span", { className: "tenue mono", children: c.cuit })] }));
}
function Pendiente({ c }) {
    const repo = useRepo();
    const avisar = useToast();
    const [ocupado, setOcupado] = useState(false);
    const pedido = c.pedido;
    const hacer = async (fn, ok) => {
        setOcupado(true);
        try {
            await fn();
            avisar(ok);
        }
        catch (e) {
            avisar(errorDe(e), 'error');
            setOcupado(false);
        }
    };
    return (_jsxs("li", { className: "admin-cuentas__fila admin-cuentas__fila--pedido", children: [_jsx(Datos, { c: c }), _jsxs("p", { children: ["Pidi\u00F3 ", _jsx("strong", { children: PLANES[pedido.plan].nombre }), " el ", fechaCorta(pedido.fecha), " \u00B7 hoy tiene ", PLANES[c.plan].nombre] }), _jsxs("div", { className: "acciones-sol", children: [_jsxs("button", { className: "btn btn--pri btn--chico", disabled: ocupado, onClick: () => hacer(() => repo.activarPlan(c.id, pedido.plan), `Plan ${PLANES[pedido.plan].nombre} activo para ${c.empresa}.`), children: ["Activar ", PLANES[pedido.plan].nombre] }), _jsx("button", { className: "btn btn--ter btn--chico", disabled: ocupado, onClick: () => hacer(() => repo.descartarPedidoPlan(c.id), 'Pedido descartado.'), children: "Descartar" })] })] }));
}
function Fila({ c }) {
    const repo = useRepo();
    const avisar = useToast();
    const [ocupado, setOcupado] = useState(false);
    const hacer = async (fn, ok) => {
        setOcupado(true);
        try {
            await fn();
            avisar(ok);
        }
        catch (e) {
            avisar(errorDe(e), 'error');
        }
        finally {
            setOcupado(false);
        }
    };
    return (_jsxs("li", { className: "admin-cuentas__fila", children: [_jsx(Datos, { c: c }), _jsxs("div", { className: "acciones-sol", children: [c.verificado ? _jsx(Pill, { tono: "ok", children: "Verificada" }) : _jsx(Pill, { tono: "senal", children: "Sin verificar" }), _jsx("button", { className: "btn btn--ter btn--chico", disabled: ocupado, onClick: () => hacer(() => repo.verificarCuenta(c.id, !c.verificado), c.verificado ? `${c.empresa} quedó sin verificar.` : `${c.empresa} verificada.`), children: c.verificado ? 'Quitar verificación' : 'Verificar' }), c.rol === 'proveedor' && (_jsxs("label", { className: "campo campo--inline", htmlFor: `plan-${c.id}`, children: [_jsx("span", { children: "Plan" }), _jsx("select", { id: `plan-${c.id}`, value: c.plan, disabled: ocupado, onChange: (e) => { const plan = e.target.value; hacer(() => repo.activarPlan(c.id, plan), `${c.empresa} pasó al plan ${PLANES[plan].nombre}.`); }, children: Object.keys(PLANES).map((id) => _jsx("option", { value: id, children: PLANES[id].nombre }, id)) })] }))] })] }));
}
