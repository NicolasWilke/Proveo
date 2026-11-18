import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSesion } from '@/app/session';
import { useQuery, useRepo } from '@/data/DataProvider';
import { region as regionDe, rubro } from '@/domain/catalogos';
import { validarValor } from '@/domain/resenas';
import { Vacio } from '@/ui/primitivas';
import { useToast } from '@/ui/Toast';
import { MARCA } from '@/config/marca';
const aBorrador = (v) => ({ min: String(v.min), mediana: String(v.mediana), max: String(v.max), fecha: v.fecha ?? '' });
function Fila({ v }) {
    const repo = useRepo();
    const avisar = useToast();
    const [b, setB] = useState(aBorrador(v));
    const [error, setError] = useState('');
    useEffect(() => setB(aBorrador(v)), [v]);
    const cambiado = JSON.stringify(b) !== JSON.stringify(aBorrador(v));
    const guardar = async () => {
        setError('');
        const nuevo = { ...v, min: Number(b.min), mediana: Number(b.mediana), max: Number(b.max), fecha: b.fecha || undefined };
        try {
            validarValor(nuevo);
            if (nuevo.fecha && !/^\d{4}-\d{2}$/.test(nuevo.fecha))
                throw new Error('La fecha va como año-mes, por ejemplo 2026-10.');
            await repo.guardarValor(nuevo);
            avisar(`Guardado: ${v.concepto}.`);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo guardar.');
        }
    };
    const num = (k, etiqueta) => (_jsxs("label", { className: "campo campo--chico", children: [_jsx("span", { children: etiqueta }), _jsx("input", { inputMode: "decimal", value: b[k], onChange: (e) => setB({ ...b, [k]: e.target.value }) })] }));
    return (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("strong", { children: v.concepto }), _jsxs("span", { className: "tenue bloque-linea", children: [rubro(v.rubro).nombre, " \u00B7 por ", v.unidad, " \u00B7 ", v.region === 'nacional' ? 'Nacional' : regionDe(v.region).nombre] }), error && _jsx("span", { className: "error bloque-linea", role: "alert", children: error })] }), _jsx("td", { children: num('min', 'Mínimo') }), _jsx("td", { children: num('mediana', 'Mediana') }), _jsx("td", { children: num('max', 'Máximo') }), _jsx("td", { children: num('fecha', 'Año-mes') }), _jsx("td", { children: _jsx("button", { className: "btn btn--sec btn--chico", disabled: !cambiado, onClick: guardar, children: "Guardar" }) })] }));
}
/** Panel para que el equipo cargue los valores de referencia sin tocar el código. */
export function EditarValores() {
    const { usuarioId } = useSesion();
    const { data, cargando } = useQuery(async (r) => ({ admin: await r.esAdmin(usuarioId), ...(await r.valoresReferencia()) }), [usuarioId]);
    if (cargando || !data)
        return _jsx("div", { className: "envoltura pagina" });
    if (!data.admin) {
        return (_jsx("div", { className: "envoltura pagina", children: _jsx(Vacio, { titulo: `Solo para el equipo de ${MARCA.nombre}`, accion: { a: '/valores', texto: 'Ver los valores' }, children: "Para editar valores, tu cuenta tiene que figurar en la colecci\u00F3n admins de Firestore." }) }));
    }
    return (_jsxs("div", { className: "envoltura pagina", children: [_jsx(Link, { to: "/valores", className: "enlace", children: "\u2190 Valores de referencia" }), _jsxs("header", { className: "pagina__cab", children: [_jsx("p", { className: "eyebrow", children: "Administraci\u00F3n" }), _jsx("h1", { children: "Editar valores de referencia" }), _jsx("p", { className: "tenue", children: "En $0 el valor se muestra como \"a definir\". Al guardar, el cambio se ve enseguida para todos." })] }), _jsx("div", { className: "tabla-envoltura", children: _jsxs("table", { className: "tabla tabla--admin", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Concepto" }), _jsx("th", { children: "M\u00EDnimo" }), _jsx("th", { children: "Mediana" }), _jsx("th", { children: "M\u00E1ximo" }), _jsx("th", { children: "Relevado" }), _jsx("th", {})] }) }), _jsx("tbody", { children: data.valores.map((v) => _jsx(Fila, { v: v }, v.id)) })] }) })] }));
}
