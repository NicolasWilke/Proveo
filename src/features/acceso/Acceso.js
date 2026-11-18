import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { evento } from '@/app/medicion';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { CUENTAS_EJEMPLO, PASSWORD_DEMO } from '@/auth/DemoAuth';
import { FalloAuth, MENSAJES_FALLO } from '@/auth/tipos';
import { MARCA } from '@/config/marca';
import { REGION } from '@/config/region';
import { mailCorporativo, PASSWORD_MIN, validarAlta } from '@/domain/acceso';
import { OpcionesRubro } from '@/ui/rubros';
import { formatearCuit } from '@/domain/cuit';
import { esMailValido } from '@/domain/validaciones';
import { t } from '@/i18n';
const mensaje = (e) => (e instanceof FalloAuth ? MENSAJES_FALLO[e.codigo] : MENSAJES_FALLO.desconocido);
export function Acceso() {
    const [params, setParams] = useSearchParams();
    const modo = params.get('modo') === 'registro' ? 'registro' : params.get('modo') === 'recuperar' ? 'recuperar' : 'ingreso';
    const { cuenta } = useAuth();
    const ir = useNavigate();
    const volver = params.get('volver') ?? '/panel';
    const cambiar = (m) => {
        const p = new URLSearchParams(params);
        p.set('modo', m);
        setParams(p, { replace: true });
    };
    // Si llegó acá redirigido (por ejemplo, justo después de crear la cuenta), lo devolvemos adonde iba.
    if (cuenta && params.has('volver'))
        return _jsx(Navigate, { to: volver, replace: true });
    if (cuenta) {
        return (_jsx("div", { className: "envoltura acceso", children: _jsxs("div", { className: "acceso__tarjeta", children: [_jsx("h1", { className: "acceso__titulo", children: "Ya iniciaste sesi\u00F3n" }), _jsxs("p", { className: "tenue", children: ["Est\u00E1s como ", cuenta.perfil.contactoNombre, ", de ", cuenta.perfil.empresa, "."] }), _jsxs("div", { className: "form__acciones", children: [_jsx(Link, { className: "btn btn--sec", to: "/perfil", children: "Mi perfil" }), _jsx("button", { className: "btn btn--pri", onClick: () => ir(volver), children: "Seguir" })] })] }) }));
    }
    return (_jsx("div", { className: "envoltura acceso", children: _jsxs("div", { className: "acceso__tarjeta", children: [modo !== 'recuperar' && (_jsxs("div", { className: "segmento segmento--ancho acceso__pestanas", role: "tablist", "aria-label": "Acceso", children: [_jsx("button", { type: "button", role: "tab", "aria-selected": modo === 'ingreso', className: modo === 'ingreso' ? 'is-activo' : '', onClick: () => cambiar('ingreso'), children: "Iniciar sesi\u00F3n" }), _jsx("button", { type: "button", role: "tab", "aria-selected": modo === 'registro', className: modo === 'registro' ? 'is-activo' : '', onClick: () => cambiar('registro'), children: "Registrarme" })] })), modo === 'ingreso' && _jsx(Ingreso, { alEntrar: () => ir(volver, { replace: true }), alOlvidar: () => cambiar('recuperar') }), modo === 'registro' && _jsx(Registro, { rolInicial: params.get('rol') === 'proveedor' ? 'proveedor' : 'comprador', alCrear: () => ir('/perfil?nuevo=1', { replace: true }) }), modo === 'recuperar' && _jsx(Recuperar, { alVolver: () => cambiar('ingreso') })] }) }));
}
function Ingreso({ alEntrar, alOlvidar }) {
    const { auth } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [ver, setVer] = useState(false);
    const [error, setError] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const entrar = async (mail, clave) => {
        setError(null);
        setEnviando(true);
        try {
            await auth.ingresar(mail, clave);
            alEntrar();
        }
        catch (e) {
            setError(mensaje(e));
            setEnviando(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("h1", { className: "acceso__titulo", children: ["Entr\u00E1 a ", MARCA.nombre] }), _jsxs("form", { className: "form", onSubmit: (e) => { e.preventDefault(); entrar(email, password); }, children: [_jsxs("label", { className: "campo", htmlFor: "ing-email", children: [_jsx("span", { children: "Email" }), _jsx("input", { id: "ing-email", type: "email", autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value), required: true })] }), _jsxs("label", { className: "campo", htmlFor: "ing-pass", children: [_jsx("span", { children: "Contrase\u00F1a" }), _jsxs("span", { className: "campo__clave", children: [_jsx("input", { id: "ing-pass", type: ver ? 'text' : 'password', autoComplete: "current-password", value: password, onChange: (e) => setPassword(e.target.value), required: true }), _jsx("button", { type: "button", className: "enlace", onClick: () => setVer(!ver), "aria-pressed": ver, children: ver ? 'Ocultar' : 'Mostrar' })] })] }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsx("button", { className: "btn btn--pri btn--grande", disabled: enviando, children: enviando ? 'Entrando…' : 'Iniciar sesión' }), _jsx("button", { type: "button", className: "enlace acceso__olvide", onClick: alOlvidar, children: "\u00BFOlvidaste tu contrase\u00F1a?" })] }), auth.modo === 'demo' && (_jsxs("div", { className: "acceso__ejemplos", children: [_jsx("p", { className: "eyebrow", children: "Demo \u00B7 cuentas de ejemplo" }), _jsx("div", { className: "acceso__ejemplos-lista", children: CUENTAS_EJEMPLO.map((c) => (_jsxs("button", { type: "button", className: "btn btn--sec", disabled: enviando, onClick: () => entrar(c.email, PASSWORD_DEMO), children: ["Entrar como ", c.nombre, " ", _jsxs("span", { className: "tenue", children: ["\u00B7 ", t.rol[c.rol].toLowerCase()] })] }, c.email))) }), _jsxs("p", { className: "tenue", children: ["Contrase\u00F1a de ambas: ", _jsx("span", { className: "mono", children: PASSWORD_DEMO }), ". Tambi\u00E9n pod\u00E9s registrarte: la cuenta queda guardada solo en este navegador."] })] }))] }));
}
const vacio = (rol) => ({ rol, empresa: '', contactoNombre: '', email: '', telefono: '', categoria: '', sector: '', ubicacion: '', cuit: '', password: '' });
function Registro({ rolInicial, alCrear }) {
    const { auth } = useAuth();
    const [d, setD] = useState(() => vacio(rolInicial));
    const [tocado, setTocado] = useState(false);
    // Dos pasos: primero la empresa, después la persona y la contraseña. Se valida cada paso por separado.
    const [paso, setPaso] = useState(1);
    const [tocado1, setTocado1] = useState(false);
    const [consiento, setConsiento] = useState(false);
    const [ver, setVer] = useState(false);
    const [error, setError] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
    const errores = validarAlta(d);
    const PASO1 = ['empresa', 'categoria', 'ubicacion', 'cuit'];
    const err = (k) => ((PASO1.includes(k) ? tocado1 || tocado : tocado) && errores[k] ? _jsx("span", { className: "error", children: errores[k] }) : null);
    const seguir = () => {
        setTocado1(true);
        if (PASO1.some((k) => errores[k]))
            return;
        setPaso(2);
    };
    const esComprador = d.rol === 'comprador';
    const crear = async (e) => {
        e.preventDefault();
        setTocado(true);
        setError(null);
        if (PASO1.some((k) => errores[k])) {
            setTocado1(true);
            setPaso(1);
            return;
        }
        if (Object.keys(errores).length || !consiento || !d.categoria) {
            if (!consiento && !Object.keys(errores).length)
                setError('Falta tu consentimiento para crear el perfil.');
            return;
        }
        setEnviando(true);
        try {
            await auth.registrar({ ...d, categoria: d.categoria, cuit: formatearCuit(d.cuit), empresa: d.empresa.trim(), contactoNombre: d.contactoNombre.trim(), sector: d.sector.trim(), ubicacion: d.ubicacion.trim() });
            evento('sign_up', { rol: d.rol });
            alCrear();
        }
        catch (e) {
            setError(mensaje(e));
            setEnviando(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsxs("h1", { className: "acceso__titulo", children: ["Sumate a ", MARCA.nombre] }), _jsx("div", { className: "segmento segmento--ancho", role: "group", "aria-label": "Tipo de cuenta", children: ['comprador', 'proveedor'].map((r) => (_jsx("button", { type: "button", "aria-pressed": d.rol === r, className: d.rol === r ? 'is-activo' : '', onClick: () => set('rol', r), children: r === 'comprador' ? 'Quiero comprar' : 'Quiero vender' }, r))) }), _jsx("p", { className: "tenue acceso__bajada", children: esComprador
                    ? 'Registrá tu empresa para pedir cotizaciones a proveedores de la red.'
                    : 'Registrá tu empresa para recibir los pedidos de tu rubro y llegar a quien compra.' }), _jsxs("ol", { className: "pasos-alta", "aria-label": "Pasos del alta", children: [_jsx("li", { className: paso === 1 ? 'is-activo' : 'is-hecho', children: "1. Tu empresa" }), _jsx("li", { className: paso === 2 ? 'is-activo' : '', children: "2. Vos y tu contrase\u00F1a" })] }), _jsxs("form", { className: "form acceso__form", onSubmit: paso === 1 ? (e) => { e.preventDefault(); seguir(); } : crear, noValidate: true, children: [paso === 1 && (_jsxs(_Fragment, { children: [_jsxs("label", { className: "campo", htmlFor: "r-empresa", children: [_jsx("span", { children: "Nombre de la empresa" }), _jsx("input", { id: "r-empresa", autoComplete: "organization", placeholder: "Ej: Servicios del Sur S.A.", value: d.empresa, onChange: (e) => set('empresa', e.target.value) }), err('empresa')] }), _jsxs("label", { className: "campo", htmlFor: "r-cuit", children: [_jsxs("span", { children: [REGION.idFiscal.nombre, " de la empresa"] }), _jsx("input", { id: "r-cuit", inputMode: "numeric", className: "mono", placeholder: `Ej: ${REGION.idFiscal.ejemplo}`, value: d.cuit, onChange: (e) => set('cuit', formatearCuit(e.target.value)) }), err('cuit') ?? (tocado1 || d.cuit.length === 13 ? !errores.cuit && _jsx("span", { className: "ok", children: "D\u00EDgito verificador correcto." }) : null)] }), _jsxs("div", { className: "form__fila", children: [_jsxs("label", { className: "campo", htmlFor: "r-cat", children: [_jsx("span", { children: esComprador ? 'Qué comprás principalmente' : 'Qué vendés principalmente' }), _jsxs("select", { id: "r-cat", value: d.categoria, onChange: (e) => set('categoria', e.target.value), children: [_jsx("option", { value: "", disabled: true, children: "Eleg\u00ED un rubro" }), _jsx(OpcionesRubro, {})] }), err('categoria')] }), _jsxs("label", { className: "campo", htmlFor: "r-ubic", children: [_jsx("span", { children: "Ciudad y provincia" }), _jsx("input", { id: "r-ubic", autoComplete: "address-level2", placeholder: "Ej: Neuqu\u00E9n, Neuqu\u00E9n", value: d.ubicacion, onChange: (e) => set('ubicacion', e.target.value) }), err('ubicacion')] })] }), _jsxs("label", { className: "campo", htmlFor: "r-sector", children: [_jsx("span", { children: "Especialidad (opcional)" }), _jsx("input", { id: "r-sector", placeholder: esComprador ? 'Ej: Alimentos, industria láctea' : 'Ej: Envases flexibles para alimentos', value: d.sector, onChange: (e) => set('sector', e.target.value) })] }), _jsx("button", { className: "btn btn--pri btn--grande", children: "Seguir" })] })), paso === 2 && (_jsxs(_Fragment, { children: [_jsxs("p", { className: "tenue", children: [d.empresa.trim(), " \u00B7 ", REGION.idFiscal.nombre, " ", d.cuit, " \u00B7 ", _jsx("button", { type: "button", className: "enlace", onClick: () => setPaso(1), children: "Cambiar" })] }), _jsxs("label", { className: "campo", htmlFor: "r-contacto", children: [_jsx("span", { children: "Tu nombre y apellido" }), _jsx("input", { id: "r-contacto", autoComplete: "name", placeholder: "Ej: Juan P\u00E9rez", value: d.contactoNombre, onChange: (e) => set('contactoNombre', e.target.value) }), err('contactoNombre')] }), _jsxs("div", { className: "form__fila", children: [_jsxs("label", { className: "campo", htmlFor: "r-email", children: [_jsx("span", { children: "Email" }), _jsx("input", { id: "r-email", type: "email", autoComplete: "email", placeholder: "nombre@empresa.com.ar", value: d.email, onChange: (e) => set('email', e.target.value) }), err('email') ?? (esComprador && esMailValido(d.email) && !mailCorporativo(d.email, REGION) && _jsx("span", { className: "tenue", children: "Con el mail de la empresa podemos verificar tu perfil m\u00E1s r\u00E1pido." }))] }), _jsxs("label", { className: "campo", htmlFor: "r-tel", children: [_jsx("span", { children: "Tel\u00E9fono" }), _jsx("input", { id: "r-tel", type: "tel", autoComplete: "tel", placeholder: "Ej: +54 9 11 1234-5678", value: d.telefono, onChange: (e) => set('telefono', e.target.value) }), err('telefono')] })] }), _jsxs("label", { className: "campo", htmlFor: "r-pass", children: [_jsx("span", { children: "Contrase\u00F1a" }), _jsxs("span", { className: "campo__clave", children: [_jsx("input", { id: "r-pass", type: ver ? 'text' : 'password', autoComplete: "new-password", value: d.password, onChange: (e) => set('password', e.target.value) }), _jsx("button", { type: "button", className: "enlace", onClick: () => setVer(!ver), "aria-pressed": ver, children: ver ? 'Ocultar' : 'Mostrar' })] }), err('password') ?? _jsxs("span", { className: "tenue", children: ["M\u00EDnimo ", PASSWORD_MIN, " caracteres."] })] }), _jsxs("label", { className: "opcion opcion--legal", children: [_jsx("input", { type: "checkbox", checked: consiento, onChange: (e) => setConsiento(e.target.checked) }), _jsxs("span", { children: [_jsx("strong", { children: "Doy mi consentimiento" }), "Acepto que ", MARCA.nombre, " trate mis datos para mostrar el perfil de mi empresa en la red, seg\u00FAn la ", REGION.leyDatos, ". ", esComprador ? 'Mi mail y teléfono los ve solo el proveedor cuya solicitud yo acepte.' : 'Los compradores registrados van a ver mi mail y teléfono; los otros proveedores, no.', " Puedo pedir acceso, rectificaci\u00F3n o supresi\u00F3n en cualquier momento."] })] }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsx("button", { className: "btn btn--pri btn--grande", disabled: enviando, children: enviando ? 'Creando la cuenta…' : 'Crear mi cuenta' })] }))] })] }));
}
function Recuperar({ alVolver }) {
    const { auth } = useAuth();
    const [email, setEmail] = useState('');
    const [estado, setEstado] = useState('editando');
    const [error, setError] = useState(null);
    const enviar = async (e) => {
        e.preventDefault();
        if (!esMailValido(email)) {
            setError('Revisá el mail.');
            return;
        }
        setError(null);
        setEstado('enviando');
        try {
            await auth.restablecerPassword(email);
            setEstado('enviado');
        }
        catch (err) {
            setError(mensaje(err));
            setEstado('editando');
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx("h1", { className: "acceso__titulo", children: "Recuper\u00E1 tu contrase\u00F1a" }), estado === 'enviado' ? (_jsxs("div", { className: "form", children: [_jsxs("p", { children: ["Si hay una cuenta con ", _jsx("strong", { children: email }), ", te llega un mail con un enlace para crear una contrase\u00F1a nueva. Revis\u00E1 tambi\u00E9n la carpeta de spam."] }), auth.modo === 'demo' && _jsx("p", { className: "nota", children: "En la demo no sale ning\u00FAn mail. Con Firebase activado, el enlace llega de verdad." }), _jsx("button", { className: "btn btn--pri", onClick: alVolver, children: "Volver a iniciar sesi\u00F3n" })] })) : (_jsxs("form", { className: "form", onSubmit: enviar, noValidate: true, children: [_jsx("p", { className: "tenue", children: "Escrib\u00ED el mail con el que te registraste y te mandamos un enlace." }), _jsxs("label", { className: "campo", htmlFor: "rec-email", children: [_jsx("span", { children: "Email" }), _jsx("input", { id: "rec-email", type: "email", autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value) })] }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsx("button", { className: "btn btn--pri btn--grande", disabled: estado === 'enviando', children: estado === 'enviando' ? 'Enviando…' : 'Enviarme el enlace' }), _jsx("button", { type: "button", className: "enlace acceso__olvide", onClick: alVolver, children: "Volver" })] }))] }));
}
