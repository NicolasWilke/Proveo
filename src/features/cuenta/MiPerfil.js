import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { prepararLogo } from '@/auth/imagen';
import { FalloAuth, MENSAJES_FALLO } from '@/auth/tipos';
import { REGION } from '@/config/region';
import { REGIONES, region, rubro } from '@/domain/catalogos';
import { OpcionesRubro } from '@/ui/rubros';
import { DIAS_INVITACION, lugaresEquipo, PLANES } from '@/domain/planes';
import { useQuery, useRepo } from '@/data/DataProvider';
import { esMailValido } from '@/domain/validaciones';
import { t } from '@/i18n';
import { Copiable, Pill, Seccion } from '@/ui/primitivas';
import { useToast } from '@/ui/Toast';
import { MisDatos } from './MisDatos';
const mensaje = (e) => (e instanceof FalloAuth ? MENSAJES_FALLO[e.codigo] : e instanceof Error ? e.message : MENSAJES_FALLO.desconocido);
export function MiPerfil() {
    const { auth, cuenta } = useAuth();
    const [params] = useSearchParams();
    const ir = useNavigate();
    const avisar = useToast();
    const c = cuenta;
    const p = c.perfil;
    // Un miembro del equipo ve el perfil de la empresa, pero lo edita el titular.
    const miembro = c.miembro;
    const [editando, setEditando] = useState(params.get('editar') === '1' && !miembro);
    return (_jsxs("div", { className: "envoltura pagina mi-perfil", children: [params.get('nuevo') === '1' && (_jsx("p", { className: "nota mi-perfil__bienvenida", children: "Tu cuenta est\u00E1 lista. Sum\u00E1 el logo de tu empresa para que te reconozcan en la red." })), _jsxs("header", { className: "mi-perfil__cab", children: [miembro ? _jsx(LogoFijo, {}) : _jsx(Logo, {}), _jsxs("div", { children: [_jsxs("p", { className: "eyebrow", children: [t.rol[p.rol], " \u00B7 ", rubro(p.categoria).nombre] }), _jsx("h1", { children: p.empresa }), _jsxs("p", { className: "tenue", children: [p.contactoNombre, p.sector && ` · ${p.sector}`, " \u00B7 ", p.ubicacion] })] })] }), _jsxs("div", { className: "mi-perfil__cols", children: [_jsx("div", { children: editando
                            ? _jsx(Edicion, { alTerminar: () => setEditando(false) })
                            : (_jsx(Seccion, { titulo: "Datos de la empresa", extra: miembro ? undefined : _jsx("button", { className: "btn btn--sec btn--chico", onClick: () => setEditando(true), children: "Editar" }), children: _jsxs("dl", { className: "datos", children: [_jsxs("div", { children: [_jsx("dt", { children: "Empresa" }), _jsx("dd", { children: p.empresa })] }), _jsxs("div", { children: [_jsx("dt", { children: "Nombre de contacto" }), _jsx("dd", { children: p.contactoNombre })] }), _jsxs("div", { children: [_jsx("dt", { children: "Email de contacto" }), _jsx("dd", { className: "mono", children: c.contacto.email })] }), _jsxs("div", { children: [_jsx("dt", { children: "Tel\u00E9fono de contacto" }), _jsx("dd", { className: "mono", children: c.contacto.telefono || '—' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Categor\u00EDa" }), _jsx("dd", { children: rubro(p.categoria).nombre })] }), _jsxs("div", { children: [_jsx("dt", { children: "Sector" }), _jsx("dd", { children: p.sector || '—' })] }), _jsxs("div", { children: [_jsx("dt", { children: "Ubicaci\u00F3n" }), _jsx("dd", { children: p.ubicacion })] }), _jsxs("div", { children: [_jsx("dt", { children: REGION.idFiscal.nombre }), _jsx("dd", { className: "mono", children: p.cuit })] })] }) })) }), _jsxs("div", { className: "mi-perfil__lateral", children: [miembro && (_jsxs(Seccion, { titulo: "Tu usuario", children: [_jsxs("p", { children: ["Sos parte del equipo de ", _jsx("strong", { children: p.empresa }), " como ", miembro.nombre, ". Cotiz\u00E1s y ped\u00EDs contactos a nombre de la empresa."] }), _jsx("p", { className: "tenue", children: "Los datos de la empresa, el plan y el equipo los maneja el titular de la cuenta." })] })), p.rol === 'proveedor' && !miembro && _jsx(Equipo, {}), p.rol === 'proveedor' && !miembro && _jsx(Regiones, {}), _jsxs(Seccion, { titulo: "Qui\u00E9n ve tu contacto", children: [_jsx("p", { children: p.rol === 'comprador'
                                            ? 'Tu mail y teléfono los ve solo el proveedor cuya solicitud aceptás. Otros compradores, no.'
                                            : 'Los compradores registrados ven tu mail y teléfono. Otros proveedores, no.' }), _jsx("p", { className: "tenue", children: "El resto de tu perfil lo ve cualquier usuario registrado." })] }), _jsxs(Seccion, { titulo: "Cuenta", children: [_jsxs("p", { className: "tenue", children: ["Ingres\u00E1s con ", _jsx("span", { className: "mono", children: c.email }), "."] }), _jsxs("div", { className: "acciones-sol", children: [_jsx("button", { className: "btn btn--sec", onClick: async () => {
                                                    try {
                                                        await auth.restablecerPassword(c.email);
                                                        avisar(auth.modo === 'demo' ? 'En la demo no sale ningún mail. Con Firebase te llega el enlace.' : `Te mandamos un enlace a ${c.email} para cambiar la contraseña.`, 'info');
                                                    }
                                                    catch (e) {
                                                        avisar(mensaje(e), 'error');
                                                    }
                                                }, children: "Cambiar contrase\u00F1a" }), _jsx("button", { className: "btn btn--ter", onClick: async () => { await auth.salir(); ir('/'); }, children: "Cerrar sesi\u00F3n" })] })] }), _jsx(MisDatos, {}), _jsx(Link, { className: "enlace", to: `/red/${c.uid}`, children: "Ver c\u00F3mo me ven en la red" }), _jsx(EnlaceAdmin, {})] })] })] }));
}
/** Equipo del plan Empresa: el titular invita con enlaces de un solo uso y saca a quien ya no corresponde. */
function Equipo() {
    const { cuenta } = useAuth();
    const repo = useRepo();
    const avisar = useToast();
    const uid = cuenta.uid;
    const { data } = useQuery(async (r) => {
        const yo = (await r.obtenerPersona(uid));
        return { yo, equipo: yo?.plan === 'empresa' ? await r.equipo(uid) : null };
    }, [uid]);
    const [etiqueta, setEtiqueta] = useState('');
    const [ocupado, setOcupado] = useState(false);
    if (!data?.yo)
        return null;
    const lugares = lugaresEquipo(data.yo.plan);
    const enlace = (codigo) => `${window.location.origin}/unirse?codigo=${codigo}`;
    const hacer = async (fn, ok) => {
        setOcupado(true);
        try {
            await fn();
            avisar(ok);
        }
        catch (e) {
            avisar(mensaje(e), 'error');
        }
        finally {
            setOcupado(false);
        }
    };
    if (!data.equipo) {
        return (_jsxs(Seccion, { titulo: "Tu equipo", children: [_jsx("p", { children: "Hoy entr\u00E1s solo vos." }), _jsxs("p", { className: "tenue", children: ["Con el plan Empresa sum\u00E1s hasta ", PLANES.empresa.usuarios - 1, " personas de tu equipo comercial, cada una con su usuario, y comparten el cupo de la empresa."] }), _jsx(Link, { className: "enlace", to: "/planes", children: "Ver planes" })] }));
    }
    const { miembros, invitaciones } = data.equipo;
    const libres = lugares - miembros.length - invitaciones.length;
    return (_jsxs(Seccion, { titulo: "Tu equipo", extra: _jsxs(Pill, { tono: "neutro", children: [miembros.length + 1, " de ", lugares + 1] }), children: [_jsxs("ul", { className: "lista-equipo", children: [_jsxs("li", { children: [_jsx("strong", { children: cuenta.perfil.contactoNombre }), " ", _jsx("span", { className: "tenue", children: "\u00B7 titular" })] }), miembros.map((m) => (_jsxs("li", { children: [_jsxs("span", { children: [_jsx("strong", { children: m.nombre }), " ", _jsxs("span", { className: "tenue", children: ["\u00B7 ", m.email] })] }), _jsx("button", { className: "enlace", disabled: ocupado, onClick: () => window.confirm(`¿Sacar a ${m.nombre} del equipo? Pierde el acceso enseguida.`)
                                    && hacer(() => repo.quitarDelEquipo(uid, m.uid), `${m.nombre} ya no es parte del equipo.`), children: "Quitar" })] }, m.uid)))] }), invitaciones.length > 0 && (_jsxs(_Fragment, { children: [_jsx("h3", { className: "sub", children: "Enlaces sin usar" }), _jsx("ul", { className: "lista-equipo", children: invitaciones.map((i) => (_jsxs("li", { className: "lista-equipo__invitacion", children: [_jsxs("span", { children: [i.etiqueta || 'Sin nombre', " ", _jsxs("span", { className: "tenue", children: ["\u00B7 vence el ", i.vence.split('-').reverse().join('/')] })] }), _jsx(Copiable, { texto: enlace(i.codigo), etiqueta: "Enlace" }), _jsx("button", { className: "enlace", disabled: ocupado, onClick: () => hacer(() => repo.cancelarInvitacion(i.codigo), 'Enlace cancelado.'), children: "Cancelar" })] }, i.codigo))) })] })), libres > 0 ? (_jsxs("form", { className: "form", onSubmit: (e) => { e.preventDefault(); hacer(async () => { await repo.invitarAlEquipo(uid, etiqueta); setEtiqueta(''); }, 'Enlace creado. Copialo y mandáselo por mail o WhatsApp.'); }, children: [_jsxs("label", { className: "campo", htmlFor: "eq-etiqueta", children: [_jsx("span", { children: "\u00BFPara qui\u00E9n es? (opcional)" }), _jsx("input", { id: "eq-etiqueta", placeholder: "Ej.: Martina, ventas zona norte", value: etiqueta, maxLength: 80, onChange: (e) => setEtiqueta(e.target.value) })] }), _jsx("button", { className: "btn btn--sec btn--chico", disabled: ocupado, children: "Crear enlace de invitaci\u00F3n" }), _jsxs("p", { className: "tenue", children: ["El enlace sirve para una sola persona y vence a los ", DIAS_INVITACION, " d\u00EDas."] })] })) : _jsx("p", { className: "tenue", children: "El equipo est\u00E1 completo. Para sumar a alguien, quit\u00E1 a otra persona o cancel\u00E1 un enlace." })] }));
}
/** El logo sin controles: lo cambia el titular. */
function LogoFijo() {
    const { cuenta } = useAuth();
    const p = cuenta.perfil;
    return (_jsx("div", { className: "logo-empresa", children: _jsx("div", { className: "logo-empresa__marco", children: p.logoUrl ? _jsx("img", { src: p.logoUrl, alt: `Logo de ${p.empresa}` }) : _jsx("span", { className: "logo-empresa__vacio", children: "Sin logo" }) }) }));
}
/** Solo para quien figura en admins/{uid}: acceso al panel del equipo. */
function EnlaceAdmin() {
    const { cuenta } = useAuth();
    const { data: admin } = useQuery((r) => r.esAdmin(cuenta.uid), [cuenta.uid]);
    return admin ? _jsx(Link, { className: "enlace bloque-linea", to: "/admin", children: "Administraci\u00F3n: cuentas y planes" }) : null;
}
/** Regiones en las que el proveedor aparece en la red. La principal sale de su ubicación; sumar es del plan Empresa. */
function Regiones() {
    const { cuenta } = useAuth();
    const repo = useRepo();
    const avisar = useToast();
    const { data: yo } = useQuery((r) => r.obtenerPersona(cuenta.uid), [cuenta.uid]);
    const [guardando, setGuardando] = useState(false);
    if (!yo)
        return null;
    const cupo = PLANES[yo.plan].regiones;
    const activas = REGIONES.filter((r) => r.id === yo.region || (yo.cobertura[r.id] ?? 0) > 0).map((r) => r.id);
    const alternar = async (id, si) => {
        const extra = (si ? [...activas, id] : activas.filter((x) => x !== id)).filter((x) => x !== yo.region);
        setGuardando(true);
        try {
            await repo.cambiarRegiones(yo.id, extra);
            avisar(si ? `Ahora también aparecés en ${region(id).nombre}.` : `Ya no aparecés en ${region(id).nombre}.`);
        }
        catch (e) {
            avisar(mensaje(e), 'error');
        }
        finally {
            setGuardando(false);
        }
    };
    return (_jsx(Seccion, { titulo: "Regiones donde trabaj\u00E1s", children: cupo > 1 ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "tenue", children: "Los compradores que filtran por estas regiones te encuentran en la red." }), _jsx("ul", { className: "lista-regiones", children: REGIONES.map((r) => (_jsx("li", { children: _jsxs("label", { className: "tarjeta__sel", children: [_jsx("input", { type: "checkbox", disabled: guardando || r.id === yo.region, checked: activas.includes(r.id), onChange: (e) => alternar(r.id, e.target.checked) }), _jsxs("span", { children: [r.nombre, r.id === yo.region && _jsx("span", { className: "tenue", children: " \u00B7 principal" })] })] }) }, r.id))) })] })) : (_jsxs(_Fragment, { children: [_jsxs("p", { children: ["Aparec\u00E9s en ", _jsx("strong", { children: region(yo.region).nombre }), ", la regi\u00F3n de tu ubicaci\u00F3n."] }), _jsx("p", { className: "tenue", children: "Con el plan Empresa sum\u00E1s las otras regiones y te encuentran compradores de todo el pa\u00EDs." }), _jsx(Link, { className: "enlace", to: "/planes", children: "Ver planes" })] })) }));
}
function Logo() {
    const { auth, cuenta } = useAuth();
    const avisar = useToast();
    const entrada = useRef(null);
    const [subiendo, setSubiendo] = useState(false);
    const p = cuenta.perfil;
    const elegir = async (archivo) => {
        if (!archivo)
            return;
        setSubiendo(true);
        try {
            await auth.subirLogo(await prepararLogo(archivo, auth.logoEnPerfil));
            avisar('Logo actualizado.');
        }
        catch (e) {
            avisar(mensaje(e), 'error');
        }
        finally {
            setSubiendo(false);
            if (entrada.current)
                entrada.current.value = '';
        }
    };
    return (_jsxs("div", { className: "logo-empresa", children: [_jsx("div", { className: "logo-empresa__marco", "aria-busy": subiendo, children: p.logoUrl ? _jsx("img", { src: p.logoUrl, alt: `Logo de ${p.empresa}` }) : _jsx("span", { className: "logo-empresa__vacio", children: "Sin logo" }) }), _jsx("input", { ref: entrada, type: "file", accept: "image/png,image/jpeg,image/webp", hidden: true, onChange: (e) => elegir(e.target.files?.[0]) }), _jsxs("div", { className: "logo-empresa__acc", children: [_jsx("button", { className: "btn btn--sec btn--chico", disabled: subiendo, onClick: () => entrada.current?.click(), children: subiendo ? 'Subiendo…' : p.logoUrl ? 'Cambiar foto o logo' : 'Subir foto o logo' }), p.logoUrl && !subiendo && _jsx("button", { className: "enlace", onClick: () => auth.quitarLogo().catch((e) => avisar(mensaje(e), 'error')), children: "Quitar" })] }), _jsxs("span", { className: "tenue logo-empresa__ayuda", children: ["PNG, JPG o WebP. Se ajusta a ", auth.logoEnPerfil ? 256 : 512, " px."] })] }));
}
function Edicion({ alTerminar }) {
    const { auth, cuenta } = useAuth();
    const avisar = useToast();
    const c = cuenta;
    const [perfil, setPerfil] = useState({
        empresa: c.perfil.empresa, contactoNombre: c.perfil.contactoNombre, categoria: c.perfil.categoria, sector: c.perfil.sector, ubicacion: c.perfil.ubicacion,
    });
    const [contacto, setContacto] = useState({ ...c.contacto });
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);
    const setP = (k, v) => setPerfil((x) => ({ ...x, [k]: v }));
    const guardar = async (e) => {
        e.preventDefault();
        if (perfil.empresa.trim().length < 2 || perfil.contactoNombre.trim().length < 2 || perfil.ubicacion.trim().length < 2) {
            setError('Empresa, contacto y ubicación no pueden quedar vacíos.');
            return;
        }
        if (!esMailValido(contacto.email)) {
            setError('Revisá el email de contacto.');
            return;
        }
        setError(null);
        setGuardando(true);
        try {
            const limpio = Object.fromEntries(Object.entries(perfil).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
            await auth.actualizarPerfil(limpio, { email: contacto.email.trim(), telefono: contacto.telefono.trim() });
            avisar('Perfil actualizado.');
            alTerminar();
        }
        catch (err) {
            setError(mensaje(err));
            setGuardando(false);
        }
    };
    return (_jsx(Seccion, { titulo: "Editar datos", extra: _jsx(Pill, { tono: "sello", children: "Editando" }), children: _jsxs("form", { className: "form", onSubmit: guardar, noValidate: true, children: [_jsxs("div", { className: "form__fila", children: [_jsxs("label", { className: "campo", htmlFor: "e-empresa", children: [_jsx("span", { children: "Nombre de la empresa" }), _jsx("input", { id: "e-empresa", value: perfil.empresa, onChange: (e) => setP('empresa', e.target.value) })] }), _jsxs("label", { className: "campo", htmlFor: "e-contacto", children: [_jsx("span", { children: "Nombre de contacto" }), _jsx("input", { id: "e-contacto", value: perfil.contactoNombre, onChange: (e) => setP('contactoNombre', e.target.value) })] })] }), _jsxs("div", { className: "form__fila", children: [_jsxs("label", { className: "campo", htmlFor: "e-email", children: [_jsx("span", { children: "Email de contacto" }), _jsx("input", { id: "e-email", type: "email", value: contacto.email, onChange: (e) => setContacto({ ...contacto, email: e.target.value }) })] }), _jsxs("label", { className: "campo", htmlFor: "e-tel", children: [_jsx("span", { children: "Tel\u00E9fono de contacto" }), _jsx("input", { id: "e-tel", type: "tel", value: contacto.telefono, onChange: (e) => setContacto({ ...contacto, telefono: e.target.value }) })] })] }), _jsxs("div", { className: "form__fila", children: [_jsxs("label", { className: "campo", htmlFor: "e-cat", children: [_jsx("span", { children: "Categor\u00EDa" }), _jsx("select", { id: "e-cat", value: perfil.categoria, onChange: (e) => setP('categoria', e.target.value), children: _jsx(OpcionesRubro, {}) })] }), _jsxs("label", { className: "campo", htmlFor: "e-sector", children: [_jsx("span", { children: "Sector" }), _jsx("input", { id: "e-sector", value: perfil.sector, onChange: (e) => setP('sector', e.target.value) })] })] }), _jsxs("label", { className: "campo", htmlFor: "e-ubic", children: [_jsx("span", { children: "Ubicaci\u00F3n" }), _jsx("input", { id: "e-ubic", value: perfil.ubicacion, onChange: (e) => setP('ubicacion', e.target.value) })] }), _jsxs("p", { className: "tenue", children: ["El ", REGION.idFiscal.nombre, " y el tipo de cuenta no se cambian desde ac\u00E1: escribinos si hace falta."] }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsxs("div", { className: "form__acciones", children: [_jsx("button", { type: "button", className: "btn btn--ter", onClick: alTerminar, children: t.acciones.cancelar }), _jsx("button", { className: "btn btn--pri", disabled: guardando, children: guardando ? 'Guardando…' : 'Guardar cambios' })] })] }) }));
}
