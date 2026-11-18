import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSesion } from '@/app/session';
import { useQuery } from '@/data/DataProvider';
import { DIVISOR_HORAS, ESCENARIOS, acumuladoAnio, acumuladoProyectado, actualizarMonto, ajustePonderado, atrasado, entre, interanual, mensual, periodos, proyectarSerie, ultimo, valorHora, } from '@/domain/indicadores';
import { variacionReal } from '@/domain/indice';
import { fmt } from '@/i18n';
import { Pill, Seccion, Vacio } from '@/ui/primitivas';
import { LineaSerie, mesCorto } from './LineaSerie';
const GRUPOS = { precios: 'Índices de precios', construccion: 'Costo de la construcción', salarios: 'Salarios por convenio' };
const pct = (v) => (v === null ? _jsx("span", { className: "tenue", children: "s/d" }) : fmt.pct(v));
const puntos = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monto = (i, v) => (i.unidad === 'puntos' ? puntos.format(v) : fmt.moneda(Math.round(v)));
const AVISO = 'Los valores son de referencia, se basan en fuentes públicas y pueden diferir del costo real de cada contratación (cargas sociales, antigüedad, adicionales, zona y margen). Verificá siempre con la escala vigente publicada por el organismo.';
/** Centro de referencias (sección 8): índices oficiales, escalas de convenio y calculadoras. Solo compradores. */
export function Referencias() {
    const { rol, usuarioId } = useSesion();
    const { data } = useQuery(async (r) => ({ ...(await r.indicadores()), admin: await r.esAdmin(usuarioId) }), [usuarioId]);
    const [abierto, setAbierto] = useState('ipc');
    if (rol !== 'comprador' && data && !data.admin) {
        return _jsx("div", { className: "envoltura pagina", children: _jsx(Vacio, { titulo: "El centro de referencias es una herramienta para compradores", children: "Sirve para revisar si una cotizaci\u00F3n es razonable y proyectar contratos." }) });
    }
    if (!data)
        return _jsx("div", { className: "envoltura pagina" });
    const { indicadores, escalas, admin } = data;
    return (_jsxs("div", { className: "envoltura pagina referencias", children: [_jsxs("header", { className: "pagina__cab", children: [_jsx("p", { className: "eyebrow", children: "Centro de referencias" }), _jsx("h1", { children: "Inflaci\u00F3n, costos y convenios, para saber si un precio es razonable" }), _jsx("p", { className: "nota", children: AVISO }), admin && _jsx(Link, { to: "/admin/indices", className: "btn btn--sec btn--chico", children: "Cargar datos nuevos" })] }), ['precios', 'construccion', 'salarios'].map((g) => (_jsx(Seccion, { titulo: GRUPOS[g], children: _jsx("div", { className: "tabla-envoltura", children: _jsxs("table", { className: "tabla", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Indicador" }), _jsx("th", { children: "\u00DAltimo dato" }), _jsx("th", { className: "num", children: "Valor" }), _jsx("th", { className: "num", children: "Mensual" }), _jsx("th", { className: "num", children: "Acumulado del a\u00F1o" }), _jsx("th", { className: "num", children: "Interanual" }), _jsx("th", { children: "Fuente" })] }) }), _jsx("tbody", { children: indicadores.filter((i) => i.grupo === g).map((i) => {
                                    const u = ultimo(i);
                                    return [
                                        _jsxs("tr", { children: [_jsxs("td", { children: [_jsx("button", { type: "button", className: "enlace tabla__tit", "aria-expanded": abierto === i.id, onClick: () => setAbierto(abierto === i.id ? null : i.id), children: i.nombre }), _jsxs("span", { className: "tenue bloque-linea", children: [i.organismo, i.base ? ` · ${i.base}` : ''] })] }), _jsxs("td", { children: [u ? mesCorto(u.periodo) : '—', atrasado(i) && _jsxs(_Fragment, { children: [" ", _jsx(Pill, { tono: "mal", children: "Sin actualizar" })] }), i.proximaPublicacion && _jsxs("span", { className: "tenue bloque-linea", children: ["Pr\u00F3ximo: ", fmt.fecha(i.proximaPublicacion)] })] }), _jsxs("td", { className: "num mono", children: [u ? monto(i, u.valor) : '—', i.unidad !== 'puntos' && _jsxs("span", { className: "tenue", children: [" /", i.unidad] })] }), _jsx("td", { className: "num mono", children: u ? pct(mensual(i, u.periodo)) : '—' }), _jsx("td", { className: "num mono", children: u ? pct(acumuladoAnio(i, u.periodo)) : '—' }), _jsx("td", { className: "num mono", children: u ? pct(interanual(i, u.periodo)) : '—' }), _jsxs("td", { children: [i.fuente.url ? _jsx("a", { href: i.fuente.url, target: "_blank", rel: "noreferrer", children: i.fuente.nombre }) : i.fuente.nombre, _jsxs("span", { className: "tenue bloque-linea", children: ["Cargado ", fmt.fecha(i.actualizado)] })] })] }, i.id),
                                        abierto === i.id && (_jsx("tr", { className: "referencias__detalle", children: _jsxs("td", { colSpan: 7, children: [_jsx(LineaSerie, { serie: i.serie, titulo: `${i.nombre}: evolución mensual` }), i.serie.some((p) => p.pactado) && _jsx("p", { className: "tenue", children: "Punteado: aumentos ya pactados en paritarias." }), i.nota && _jsx("p", { className: "tenue", children: i.nota })] }) }, `${i.id}-g`)),
                                    ];
                                }) })] }) }) }, g))), _jsxs(Seccion, { titulo: "Escalas vigentes y valor hora", children: [_jsxs("p", { className: "tenue", children: ["Valor hora = mensual \u00F7 ", DIVISOR_HORAS, ". El conformado incluye b\u00E1sico, presentismo, vi\u00E1tico y sumas no remunerativas; no incluye antig\u00FCedad, nocturnidad, horas extra, cargas sociales, ART, uniformes, supervisi\u00F3n, margen ni IVA, as\u00ED que no es el precio que factura una empresa."] }), _jsx("div", { className: "grilla-2", children: escalas.map((e) => _jsx(Escala, { e: e }, e.id)) })] }), _jsxs("div", { className: "grilla-2", children: [_jsx(Actualizar, { indicadores: indicadores }), _jsx(Razonable, { indicadores: indicadores }), _jsx(Proyectar, { indicadores: indicadores }), _jsx(Clausula, { indicadores: indicadores })] })] }));
}
function Escala({ e }) {
    const porHora = e.categorias.some((c) => c.hora);
    return (_jsxs("article", { className: "tarjeta", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: e.actividad }), _jsx("h3", { children: e.convenio }), _jsxs("p", { className: "tenue", children: ["Escala de ", mesCorto(e.periodo), e.vigenciaHasta && ` · acuerdo vigente hasta el ${fmt.fecha(e.vigenciaHasta)}`] })] }), _jsx("div", { className: "desborde", children: _jsxs("table", { className: "tabla tabla--compacta", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "Categor\u00EDa" }), porHora ? _jsx("th", { className: "num", children: "Por hora" }) : _jsxs(_Fragment, { children: [_jsx("th", { className: "num", children: "B\u00E1sico" }), _jsx("th", { className: "num", children: "Conformado" }), _jsxs("th", { className: "num", children: ["Hora (\u00F7", DIVISOR_HORAS, ")"] })] })] }) }), _jsx("tbody", { children: e.categorias.map((c) => (_jsxs("tr", { children: [_jsx("td", { children: c.nombre }), porHora
                                        ? _jsx("td", { className: "num mono", children: c.hora ? fmt.moneda(c.hora) : '—' })
                                        : _jsxs(_Fragment, { children: [_jsx("td", { className: "num mono", children: c.basico ? fmt.moneda(c.basico) : '—' }), _jsx("td", { className: "num mono", children: c.conformado ? fmt.moneda(c.conformado) : '—' }), _jsx("td", { className: "num mono", children: fmt.moneda(Math.round(valorHora(c.conformado ?? c.basico) ?? 0)) })] })] }, c.nombre))) })] }) }), e.nota && _jsx("p", { className: "tenue", children: e.nota }), e.proximaRevision && _jsxs("p", { className: "tenue", children: ["Pr\u00F3xima revisi\u00F3n: ", e.proximaRevision, "."] }), _jsxs("p", { className: "tenue", children: ["Fuente: ", e.fuente.url ? _jsx("a", { href: e.fuente.url, target: "_blank", rel: "noreferrer", children: e.fuente.nombre }) : e.fuente.nombre, " \u00B7 cargado ", fmt.fecha(e.actualizado)] })] }));
}
function ElegirIndicador({ id, valor, onCambio, indicadores, etiqueta = 'Indicador' }) {
    return (_jsxs("label", { className: "campo", htmlFor: id, children: [_jsx("span", { children: etiqueta }), _jsx("select", { id: id, value: valor, onChange: (e) => onCambio(e.target.value), children: ['precios', 'construccion', 'salarios'].map((g) => (_jsx("optgroup", { label: GRUPOS[g], children: indicadores.filter((i) => i.grupo === g).map((i) => _jsx("option", { value: i.id, children: i.nombre }, i.id)) }, g))) })] }));
}
function ElegirMes({ id, etiqueta, valor, onCambio, opciones }) {
    return (_jsxs("label", { className: "campo", htmlFor: id, children: [_jsx("span", { children: etiqueta }), _jsx("select", { id: id, value: valor, onChange: (e) => onCambio(e.target.value), children: opciones.map((p) => _jsx("option", { value: p, children: mesCorto(p) }, p)) })] }));
}
/** Monto actualizado = monto × (índice final ÷ índice inicial). */
function Actualizar({ indicadores }) {
    const [id, setId] = useState('ipc');
    const i = indicadores.find((x) => x.id === id);
    const ps = periodos(i).filter((p) => !i.serie.find((x) => x.periodo === p)?.pactado);
    const [desde, setDesde] = useState(ps[0]);
    const [hasta, setHasta] = useState(ps[ps.length - 1]);
    const [monto, setMonto] = useState('1000000');
    const d = ps.includes(desde) ? desde : ps[0];
    const h = ps.includes(hasta) ? hasta : ps[ps.length - 1];
    const r = actualizarMonto(Number(monto) || 0, i, d, h);
    return (_jsxs(Seccion, { titulo: "Actualizar un monto", children: [_jsx(ElegirIndicador, { id: "act-ind", valor: id, onCambio: setId, indicadores: indicadores }), _jsxs("div", { className: "form__fila", children: [_jsx(ElegirMes, { id: "act-desde", etiqueta: "Desde", valor: d, onCambio: setDesde, opciones: ps }), _jsx(ElegirMes, { id: "act-hasta", etiqueta: "Hasta", valor: h, onCambio: setHasta, opciones: ps })] }), _jsxs("label", { className: "campo", htmlFor: "act-monto", children: [_jsx("span", { children: "Monto original" }), _jsx("input", { id: "act-monto", inputMode: "decimal", value: monto, onChange: (e) => setMonto(e.target.value) })] }), r !== null && _jsxs("p", { className: "resultado", children: [_jsx("strong", { className: "mono", children: fmt.moneda(Math.round(r)) }), " ", _jsxs("span", { className: "tenue", children: ["(", pct(entre(i, d, h)), " entre ", mesCorto(d), " y ", mesCorto(h), ")"] })] })] }));
}
/** Brecha: compara el aumento que pide un proveedor con la inflación, los mayoristas y el convenio que aplica. */
function Razonable({ indicadores }) {
    const [pedido, setPedido] = useState('40');
    const [conv, setConv] = useState('vigilador-basico');
    const ref = (id) => {
        const i = indicadores.find((x) => x.id === id);
        const u = i && ultimo(i);
        if (!i || !u)
            return null;
        const ia = interanual(i, u.periodo);
        return ia !== null ? { nombre: i.nombre, v: ia, que: 'interanual' } : { nombre: i.nombre, v: acumuladoAnio(i, u.periodo), que: `acumulado ${u.periodo.slice(0, 4)}` };
    };
    const filas = [ref('ipc'), ref('ipim'), ref(conv)].filter((x) => !!x && x.v !== null);
    const p = Number(pedido) || 0;
    return (_jsxs(Seccion, { titulo: "\u00BFEs razonable el aumento que piden?", children: [_jsxs("label", { className: "campo", htmlFor: "raz-pct", children: [_jsx("span", { children: "Aumento que pide el proveedor (% anual)" }), _jsx("input", { id: "raz-pct", inputMode: "decimal", value: pedido, onChange: (e) => setPedido(e.target.value) })] }), _jsx(ElegirIndicador, { id: "raz-conv", etiqueta: "Convenio o costo que aplica", valor: conv, onCambio: setConv, indicadores: indicadores.filter((i) => i.grupo !== 'precios') }), _jsx("ul", { className: "lista-brecha", children: filas.map((f) => {
                    const brecha = p - f.v;
                    return _jsxs("li", { children: [_jsxs("span", { children: [f.nombre, " ", _jsxs("span", { className: "tenue", children: ["(", f.que, ")"] })] }), _jsx("span", { className: "mono", children: fmt.pct(f.v) }), _jsx(Pill, { tono: brecha > 5 ? 'mal' : brecha > 0 ? 'senal' : 'ok', children: brecha > 0 ? `${fmt.pct(brecha, false)} por encima` : 'En línea o por debajo' })] }, f.nombre);
                }) }), filas[0] && _jsxs("p", { className: "tenue", children: ["En t\u00E9rminos reales, ", fmt.pct(p), " contra la inflaci\u00F3n es ", fmt.pct(variacionReal(p, filas[0].v)), "."] })] }));
}
function Proyectar({ indicadores }) {
    const [id, setId] = useState('vigilador-conformado');
    const [esc, setEsc] = useState('base');
    const [propia, setPropia] = useState('2');
    const [meses, setMeses] = useState(6);
    const i = indicadores.find((x) => x.id === id);
    const tasa = esc === 'propia' ? Number(propia) || 0 : ESCENARIOS[esc];
    const proy = proyectarSerie(i, tasa, meses);
    const u = ultimo(i);
    const fin = proy[proy.length - 1];
    return (_jsxs(Seccion, { titulo: "Proyectar un valor", children: [_jsx(ElegirIndicador, { id: "pro-ind", valor: id, onCambio: setId, indicadores: indicadores }), _jsxs("div", { className: "segmento segmento--apilable", role: "group", "aria-label": "Escenario", children: [Object.keys(ESCENARIOS).map((k) => _jsxs("button", { type: "button", className: esc === k ? 'is-activo' : '', "aria-pressed": esc === k, onClick: () => setEsc(k), children: [k[0].toUpperCase() + k.slice(1), " ", fmt.pct(ESCENARIOS[k], false)] }, k)), _jsx("button", { type: "button", className: esc === 'propia' ? 'is-activo' : '', "aria-pressed": esc === 'propia', onClick: () => setEsc('propia'), children: "Mi tasa" })] }), _jsxs("div", { className: "form__fila", children: [esc === 'propia' && _jsxs("label", { className: "campo", htmlFor: "pro-tasa", children: [_jsx("span", { children: "Inflaci\u00F3n mensual supuesta (%)" }), _jsx("input", { id: "pro-tasa", inputMode: "decimal", value: propia, onChange: (e) => setPropia(e.target.value) })] }), _jsxs("label", { className: "campo", htmlFor: "pro-meses", children: [_jsx("span", { children: "Meses" }), _jsx("select", { id: "pro-meses", value: meses, onChange: (e) => setMeses(Number(e.target.value)), children: [3, 6, 12].map((n) => _jsx("option", { value: n, children: n }, n)) })] })] }), u && fin && (_jsxs(_Fragment, { children: [_jsxs("p", { className: "resultado", children: [mesCorto(fin.periodo), ": ", _jsx("strong", { className: "mono", children: monto(i, fin.valor) }), " ", _jsxs("span", { className: "tenue", children: ["(", fmt.pct((fin.valor / u.valor - 1) * 100), " sobre ", mesCorto(u.periodo), "; la tasa sola dar\u00EDa ", fmt.pct(acumuladoProyectado(tasa, meses)), ")"] })] }), i.unidad === 'mes' && _jsxs("p", { className: "tenue", children: ["Valor hora proyectado (\u00F7", DIVISOR_HORAS, "): ", fmt.moneda(Math.round(valorHora(fin.valor)))] }), _jsx(LineaSerie, { serie: i.serie.filter((p) => !p.pactado), extra: proy, titulo: `${i.nombre}: proyección a ${meses} meses` }), proy.some((p) => p.pactado) && _jsx("p", { className: "tenue", children: "Usa los aumentos ya pactados y aplica la tasa reci\u00E9n despu\u00E9s." })] })), _jsx("p", { className: "tenue", children: "Estimaci\u00F3n orientativa: no garantiza valores futuros. El escenario base toma la inflaci\u00F3n de septiembre 2026; reemplazalo por la expectativa del REM del BCRA cuando la cargues." })] }));
}
const COMPONENTES_INICIALES = [{ peso: '60', id: 'vigilador-basico', nombre: 'Mano de obra' }, { peso: '25', id: 'ipim', nombre: 'Materiales e insumos' }, { peso: '15', id: 'ipc-ba', nombre: 'Gastos generales' }];
/** Cláusula de ajuste ponderada: cada componente con su peso y su índice. */
function Clausula({ indicadores }) {
    const [comps, setComps] = useState(COMPONENTES_INICIALES);
    const [desde, setDesde] = useState('2025-12');
    const [hasta, setHasta] = useState('2026-09');
    const opciones = ['2025-09', '2025-12', '2026-07', '2026-08', '2026-09', '2026-10'];
    const filas = comps.map((c) => ({ ...c, v: entre(indicadores.find((i) => i.id === c.id), desde, hasta) }));
    let resultado = null;
    let error = '';
    if (filas.every((f) => f.v !== null)) {
        try {
            resultado = ajustePonderado(filas.map((f) => ({ peso: Number(f.peso) || 0, variacion: f.v })));
        }
        catch (e) {
            error = e.message;
        }
    }
    else
        error = 'Algún indicador no tiene dato para esos meses: probá con otro período.';
    return (_jsxs(Seccion, { titulo: "Simular una cl\u00E1usula de ajuste", children: [_jsxs("div", { className: "form__fila", children: [_jsx(ElegirMes, { id: "cla-desde", etiqueta: "Desde", valor: desde, onCambio: setDesde, opciones: opciones }), _jsx(ElegirMes, { id: "cla-hasta", etiqueta: "Hasta", valor: hasta, onCambio: setHasta, opciones: opciones })] }), filas.map((f, n) => (_jsxs("div", { className: "clausula__fila", children: [_jsxs("label", { className: "campo campo--chico", htmlFor: `cla-p${n}`, children: [_jsxs("span", { children: [f.nombre, " (%)"] }), _jsx("input", { id: `cla-p${n}`, inputMode: "decimal", value: f.peso, onChange: (e) => setComps(comps.map((c, j) => (j === n ? { ...c, peso: e.target.value } : c))) })] }), _jsx(ElegirIndicador, { id: `cla-i${n}`, etiqueta: "\u00CDndice", valor: f.id, onCambio: (v) => setComps(comps.map((c, j) => (j === n ? { ...c, id: v } : c))), indicadores: indicadores }), _jsx("span", { className: "mono clausula__var", children: pct(f.v) })] }, f.nombre))), resultado !== null && _jsxs("p", { className: "resultado", children: ["Ajuste del per\u00EDodo: ", _jsx("strong", { className: "mono", children: fmt.pct(resultado) })] }), error && _jsx("p", { className: "error", role: "alert", children: error })] }));
}
