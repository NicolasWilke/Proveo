import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useContacto } from '@/auth/AuthProvider';
import { Copiable } from '@/ui/primitivas';
/** Mail y teléfono de una persona, si la política de contacto lo permite. */
export function ContactoPersona({ p, aceptado = false }) {
    const c = useContacto(p, aceptado);
    if (!c)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx(Copiable, { etiqueta: "Mail", texto: c.email }), c.telefono && _jsx(Copiable, { etiqueta: "Tel\u00E9fono", texto: c.telefono })] }));
}
