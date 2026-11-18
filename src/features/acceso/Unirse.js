import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { FalloAuth, MENSAJES_FALLO } from '@/auth/tipos';
import { MARCA } from '@/config/marca';
import { PASSWORD_MIN } from '@/domain/acceso';
import { useQuery } from '@/data/DataProvider';
import { esMailValido } from '@/domain/validaciones';
const mensaje = (e) => (e instanceof FalloAuth ? MENSAJES_FALLO[e.codigo] : e instanceof Error ? e.message : MENSAJES_FALLO.desconocido);
const fecha = (iso) => iso.split('-').reverse().join('/');
/**
 * /unirse?codigo=…: quien recibe el enlace del titular crea su usuario y queda en el equipo de la empresa.
 * No tiene perfil propio: entra a la red como la empresa (pedidos, ofertas, solicitudes).
 */
export function Unirse() {
    const [params] = useSearchParams();
    const codigo = params.get('codigo') ?? '';
    const { auth, cuenta } = useAuth();
    const ir = useNavigate();
    const { data: inv, cargando } = useQuery(() => (codigo ? auth.leerInvitacion(codigo) : Promise.resolve(null)), [codigo]);
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [enviando, setEnviando] = useState(false);
    if (cargando)
        return _jsx("div", { className: "envoltura acceso", "aria-busy": "true" });
    if (!inv) {
        return (_jsx("div", { className: "envoltura acceso", children: _jsxs("div", { className: "acceso__tarjeta", children: [_jsx("h1", { className: "acceso__titulo", children: "Este enlace no sirve" }), _jsx("p", { children: MENSAJES_FALLO['invitacion-invalida'] }), _jsx("div", { className: "form__acciones", children: _jsx(Link, { className: "btn btn--sec", to: "/", children: "Ir al inicio" }) })] }) }));
    }
    if (cuenta) {
        return (_jsx("div", { className: "envoltura acceso", children: _jsxs("div", { className: "acceso__tarjeta", children: [_jsx("h1", { className: "acceso__titulo", children: "Ya ten\u00E9s sesi\u00F3n iniciada" }), _jsxs("p", { children: ["Para sumarte al equipo de ", _jsx("strong", { children: inv.empresa }), " necesit\u00E1s un usuario nuevo. Cerr\u00E1 la sesi\u00F3n de ", cuenta.perfil.empresa, " y volv\u00E9 a abrir el enlace."] }), _jsxs("p", { className: "tenue", children: ["Una cuenta que ya tiene su propia empresa en ", MARCA.nombre, " no puede ser parte de otro equipo."] }), _jsx("div", { className: "form__acciones", children: _jsx("button", { className: "btn btn--sec", onClick: () => auth.salir(), children: "Cerrar sesi\u00F3n" }) })] }) }));
    }
    const enviar = async (e) => {
        e.preventDefault();
        if (nombre.trim().length < 2) {
            setError('Escribí tu nombre y apellido.');
            return;
        }
        if (!esMailValido(email)) {
            setError('Revisá el mail.');
            return;
        }
        if (password.length < PASSWORD_MIN) {
            setError(`La contraseña tiene que tener al menos ${PASSWORD_MIN} caracteres.`);
            return;
        }
        setError(null);
        setEnviando(true);
        try {
            await auth.unirseAEquipo(codigo, { nombre, email, password });
            ir('/panel', { replace: true });
        }
        catch (err) {
            setError(mensaje(err));
            setEnviando(false);
        }
    };
    return (_jsx("div", { className: "envoltura acceso", children: _jsxs("div", { className: "acceso__tarjeta", children: [_jsx("p", { className: "eyebrow", children: "Invitaci\u00F3n al equipo" }), _jsxs("h1", { className: "acceso__titulo", children: ["Sumate a ", inv.empresa] }), _jsxs("p", { className: "tenue", children: ["Vas a ver los pedidos, cotizar y pedir contactos a nombre de ", inv.empresa, ", con tu propio usuario. El enlace sirve una sola vez, hasta el ", fecha(inv.vence), "."] }), _jsxs("form", { className: "form", onSubmit: enviar, noValidate: true, children: [_jsxs("label", { className: "campo", htmlFor: "u-nombre", children: [_jsx("span", { children: "Tu nombre y apellido" }), _jsx("input", { id: "u-nombre", autoComplete: "name", value: nombre, onChange: (e) => setNombre(e.target.value) })] }), _jsxs("label", { className: "campo", htmlFor: "u-email", children: [_jsx("span", { children: "Tu mail" }), _jsx("input", { id: "u-email", type: "email", autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value) })] }), _jsxs("label", { className: "campo", htmlFor: "u-pass", children: [_jsx("span", { children: "Contrase\u00F1a" }), _jsx("input", { id: "u-pass", type: "password", autoComplete: "new-password", value: password, onChange: (e) => setPassword(e.target.value) })] }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsx("div", { className: "form__acciones", children: _jsx("button", { className: "btn btn--pri", disabled: enviando, children: enviando ? 'Creando tu usuario…' : 'Crear usuario y sumarme' }) })] })] }) }));
}
