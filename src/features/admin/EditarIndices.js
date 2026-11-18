import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSesion } from '@/app/session';
import { useQuery, useRepo } from '@/data/DataProvider';
import { atrasado, conPunto, periodoValido, sumarMeses, ultimo, validarPunto } from '@/domain/indicadores';
import { fmt } from '@/i18n';
import { Pill, Seccion, Vacio } from '@/ui/primitivas';
import { useToast } from '@/ui/Toast';
import { mesCorto } from '../referencias/LineaSerie';
import { MARCA } from '@/config/marca';
/** Carga del equipo: un dato nuevo por indicador y las escalas vigentes de cada convenio. */
export function EditarIndices() {
    const { usuarioId } = useSesion();
    const { data, cargando } = useQuery(async (r) => ({ admin: await r.esAdmin(usuarioId), ...(await r.indicadores()) }), [usuarioId]);
    if (cargando || !data)
        return _jsx("div", { className: "envoltura pagina" });
    if (!data.admin) {
        return _jsx("div", { className: "envoltura pagina", children: _jsx(Vacio, { titulo: `Solo para el equipo de ${MARCA.nombre}`, accion: { a: '/referencias', texto: 'Ver el centro de referencias' }, children: "Para cargar \u00EDndices, tu cuenta tiene que figurar en la colecci\u00F3n admins de Firestore." }) });
    }
    return (_jsxs("div", { className: "envoltura pagina", children: [_jsx(Link, { to: "/referencias", className: "enlace", children: "\u2190 Centro de referencias" }), _jsxs("header", { className: "pagina__cab", children: [_jsx("p", { className: "eyebrow", children: "Administraci\u00F3n" }), _jsx("h1", { children: "Cargar \u00EDndices y escalas" }), _jsx("p", { className: "tenue", children: "Cada dato se valida antes de guardarse: per\u00EDodo a\u00F1o-mes, sin duplicados, y aviso si la variaci\u00F3n mensual salta m\u00E1s de 3 puntos. Un aumento pactado se reemplaza cuando sale el dato oficial." })] }), _jsx(Seccion, { titulo: "\u00CDndices y salarios", children: _jsx("div", { className: "tabla-envoltura", children: _jsxs("table", { className: "tabla tabla--admin", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Indicador" }), _jsx("th", { children: "\u00DAltimos datos" }), _jsx("th", { children: "Dato nuevo" })] }) }), _jsx("tbody", { children: data.indicadores.map((i) => _jsx(FilaIndicador, { i: i }, i.id)) })] }) }) }), _jsx(Seccion, { titulo: "Escalas vigentes", children: _jsx("div", { className: "grilla-2", children: data.escalas.map((e) => _jsx(FormEscala, { e: e }, e.id)) }) })] }));
}
function FilaIndicador({ i }) {
    const repo = useRepo();
    const avisar = useToast();
    const u = ultimo(i);
    const [periodo, setPeriodo] = useState(u ? sumarMeses(u.periodo, 1) : '');
    const [valor, setValor] = useState('');
    const [pactado, setPactado] = useState(false);
    const [proxima, setProxima] = useState(i.proximaPublicacion ?? '');
    const [aviso, setAviso] = useState('');
    const [error, setError] = useState('');
    const guardar = async (confirmado) => {
        setError('');
        const punto = { periodo, valor: Number(valor), ...(pactado ? { pactado: true } : {}) };
        try {
            const a = validarPunto(i, punto);
            if (a && !confirmado) {
                setAviso(a);
                return;
            }
            await repo.guardarIndicador({ ...i, serie: conPunto(i.serie, punto), proximaPublicacion: proxima || undefined });
            setAviso('');
            setValor('');
            avisar(`Guardado: ${i.nombre}, ${mesCorto(periodo)}.`);
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo guardar.');
        }
    };
    return (_jsxs("tr", { children: [_jsxs("td", { children: [_jsx("strong", { children: i.nombre }), atrasado(i) && _jsxs(_Fragment, { children: [" ", _jsx(Pill, { tono: "mal", children: "M\u00E1s de 45 d\u00EDas sin cargar" })] }), _jsxs("span", { className: "tenue bloque-linea", children: [i.organismo, " \u00B7 cargado ", fmt.fecha(i.actualizado)] })] }), _jsx("td", { className: "mono", children: i.serie.slice(-3).map((p) => _jsxs("span", { className: "bloque-linea", children: [mesCorto(p.periodo), ": ", fmt.numero(p.valor), p.pactado ? ' (pactado)' : ''] }, p.periodo)) }), _jsxs("td", { children: [_jsxs("div", { className: "admin-dato", children: [_jsxs("label", { className: "campo campo--chico", children: [_jsx("span", { children: "A\u00F1o-mes" }), _jsx("input", { value: periodo, onChange: (e) => { setPeriodo(e.target.value); setAviso(''); }, placeholder: "2026-10" })] }), _jsxs("label", { className: "campo campo--chico", children: [_jsx("span", { children: "Valor" }), _jsx("input", { inputMode: "decimal", value: valor, onChange: (e) => { setValor(e.target.value); setAviso(''); } })] }), _jsxs("label", { className: "campo campo--chico", children: [_jsx("span", { children: "Pr\u00F3xima publicaci\u00F3n" }), _jsx("input", { type: "date", value: proxima, onChange: (e) => setProxima(e.target.value) })] }), _jsxs("label", { className: "tarjeta__sel", children: [_jsx("input", { type: "checkbox", checked: pactado, onChange: (e) => setPactado(e.target.checked) }), _jsx("span", { children: "Pactado" })] }), _jsx("button", { className: "btn btn--sec btn--chico", disabled: !periodo || !valor, onClick: () => guardar(false), children: "Guardar" })] }), aviso && _jsxs("p", { className: "nota", children: [aviso, " ", _jsx("button", { className: "enlace", onClick: () => guardar(true), children: "Guardar igual" })] }), error && _jsx("p", { className: "error", role: "alert", children: error })] })] }));
}
function FormEscala({ e }) {
    const repo = useRepo();
    const avisar = useToast();
    const [b, setB] = useState(e);
    const [error, setError] = useState('');
    const cat = (n, k, v) => setB({ ...b, categorias: b.categorias.map((c, j) => (j === n ? { ...c, [k]: v === '' ? null : Number(v) } : c)) });
    const guardar = async () => {
        setError('');
        if (!periodoValido(b.periodo)) {
            setError('El período va como año-mes, por ejemplo 2026-10.');
            return;
        }
        await repo.guardarEscala(b);
        avisar(`Guardada la escala ${b.convenio}.`);
    };
    const porHora = e.categorias.some((c) => c.hora);
    return (_jsxs("article", { className: "tarjeta", children: [_jsx("h3", { children: e.convenio }), _jsxs("div", { className: "form__fila", children: [_jsxs("label", { className: "campo campo--chico", children: [_jsx("span", { children: "Escala de (a\u00F1o-mes)" }), _jsx("input", { value: b.periodo, onChange: (x) => setB({ ...b, periodo: x.target.value }) })] }), _jsxs("label", { className: "campo campo--chico", children: [_jsx("span", { children: "Vigente hasta" }), _jsx("input", { type: "date", value: b.vigenciaHasta ?? '', onChange: (x) => setB({ ...b, vigenciaHasta: x.target.value || undefined }) })] })] }), b.categorias.map((c, n) => (_jsxs("div", { className: "admin-dato", children: [_jsx("span", { className: "admin-dato__nombre", children: c.nombre }), porHora
                        ? _jsxs("label", { className: "campo campo--chico", children: [_jsx("span", { children: "Por hora" }), _jsx("input", { inputMode: "decimal", value: c.hora ?? '', onChange: (x) => cat(n, 'hora', x.target.value) })] })
                        : _jsxs(_Fragment, { children: [_jsxs("label", { className: "campo campo--chico", children: [_jsx("span", { children: "B\u00E1sico" }), _jsx("input", { inputMode: "decimal", value: c.basico ?? '', onChange: (x) => cat(n, 'basico', x.target.value) })] }), _jsxs("label", { className: "campo campo--chico", children: [_jsx("span", { children: "Conformado" }), _jsx("input", { inputMode: "decimal", value: c.conformado ?? '', onChange: (x) => cat(n, 'conformado', x.target.value) })] })] })] }, c.nombre))), _jsxs("label", { className: "campo", children: [_jsx("span", { children: "Nota" }), _jsx("textarea", { rows: 2, value: b.nota ?? '', onChange: (x) => setB({ ...b, nota: x.target.value || undefined }) })] }), error && _jsx("p", { className: "error", role: "alert", children: error }), _jsx("div", { className: "form__acciones", children: _jsx("button", { className: "btn btn--sec btn--chico", disabled: JSON.stringify(b) === JSON.stringify(e), onClick: guardar, children: "Guardar escala" }) })] }));
}
