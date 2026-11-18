import { jsx as _jsx } from "react/jsx-runtime";
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
/** Las secciones de la red son solo para usuarios registrados. */
export function RequiereSesion() {
    const { cuenta } = useAuth();
    const { pathname, search } = useLocation();
    if (!cuenta)
        return _jsx(Navigate, { to: `/ingresar?volver=${encodeURIComponent(pathname + search)}`, replace: true });
    return _jsx(Outlet, {});
}
