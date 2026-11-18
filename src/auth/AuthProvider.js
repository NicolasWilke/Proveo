import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
import { useRepo } from '@/data/DataProvider';
import { puedeVerContacto } from '@/domain/acceso';
import { crearAuth } from '.';
const Ctx = createContext(null);
/**
 * Sesión de la app. Mientras pedidos, cotizaciones y la red sigan en el repositorio de la demo,
 * cada cuenta se refleja ahí como una persona con el mismo id (sincronizarCuenta).
 */
export function AuthProvider({ children }) {
    const repo = useRepo();
    const [auth, setAuth] = useState(null);
    const [cuenta, setCuenta] = useState(undefined);
    const [fallo, setFallo] = useState(null);
    useEffect(() => {
        let desuscribir = () => { };
        let vigente = true;
        crearAuth().then((a) => {
            if (!vigente)
                return;
            setAuth(a);
            desuscribir = a.observar(async (c) => {
                // Un fallo al reflejar la cuenta en los datos no puede dejar la sesión sin publicar.
                if (c)
                    await repo.sincronizarCuenta({ ...c.perfil, email: c.contacto.email, telefono: c.contacto.telefono }).catch((e) => console.error(e));
                setCuenta(c);
            });
        }, (e) => setFallo(e.message));
        return () => { vigente = false; desuscribir(); };
    }, [repo]);
    if (fallo)
        return _jsx("div", { className: "envoltura pagina", children: _jsxs("p", { className: "error", children: ["No se pudo iniciar la autenticaci\u00F3n: ", fallo] }) });
    if (!auth || cuenta === undefined)
        return _jsx("div", { className: "arranque", "aria-busy": "true" });
    return _jsx(Ctx.Provider, { value: { auth, cuenta }, children: children });
}
export function useAuth() {
    const s = useContext(Ctx);
    if (!s)
        throw new Error('useAuth fuera de AuthProvider');
    return s;
}
/**
 * Mail y teléfono de otra persona, solo si la política lo permite.
 * `aceptadoLocal`: la solicitud de este proveedor figura aceptada en los datos de la demo.
 * Para cuentas reales manda lo que respondan las reglas; el dato local solo cubre a las personas de ejemplo.
 */
export function useContacto(p, aceptadoLocal = false) {
    const { auth, cuenta } = useAuth();
    const posible = !!p && !!cuenta && puedeVerContacto(cuenta.perfil, { uid: p.id, rol: p.rol }, true);
    const respaldo = !!p && !!cuenta && puedeVerContacto(cuenta.perfil, { uid: p.id, rol: p.rol }, aceptadoLocal);
    const [contacto, setContacto] = useState(null);
    useEffect(() => {
        if (!posible || !p) {
            setContacto(null);
            return;
        }
        let vigente = true;
        const local = respaldo && p.contacto.email ? p.contacto : null;
        auth.contactoDe(p.id).then((c) => vigente && setContacto(c ?? local), () => vigente && setContacto(local));
        return () => { vigente = false; };
    }, [auth, posible, respaldo, p]);
    return posible ? contacto : null;
}
/** Responder una solicitud de contacto: al aceptar, también habilita el contacto en las reglas. */
export function useResponderSolicitud() {
    const { auth } = useAuth();
    const repo = useRepo();
    return async (s, estado) => {
        if (estado === 'aceptada')
            await auth.aceptarProveedor(s.proveedorId);
        await repo.responderSolicitud(s.id, estado);
    };
}
