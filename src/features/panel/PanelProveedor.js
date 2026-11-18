import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { recibeOfertas } from '@/domain/rfq';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSesion } from '@/app/session';
import { useAuth } from '@/auth/AuthProvider';
import { useQuery, useRepo } from '@/data/DataProvider';
import { useToast } from '@/ui/Toast';
import { PLANES } from '@/domain/planes';
import { estadoVisibleParaProveedor } from '@/domain/reglas';
import { fmt, t } from '@/i18n';
import { Avatar, Medidor, Pill, Seccion, Vacio } from '@/ui/primitivas';
import { ventanaAbierta } from '../red/FichaComprador';
import { PedirContacto } from '../red/PedirContacto';
import { TarjetaComprador } from '../red/TarjetaProveedor';
import { ContactoPersona } from '../red/ContactoPersona';
import { PedidosDeValor } from '../recientes/PedidosDeValor';
import { PrimerosPasos } from './PrimerosPasos';
const TONO = { pendiente: 'senal', aceptada: 'ok', postergada: 'neutro', cerrada: 'neutro' };
export function PanelProveedor() {
    const { usuarioId } = useSesion();
    const { cuenta } = useAuth();
    const [contactar, setContactar] = useState(null);
    const repo = useRepo();
    const avisar = useToast();
    const { data } = useQuery(async (r) => {
        const yo = (await r.obtenerPersona(usuarioId));
        const [uso, embudo, enviadas, compradores, pedidos] = await Promise.all([
            r.uso(usuarioId), r.embudo(usuarioId), r.solicitudesEnviadas(usuarioId), r.listarCompradores(), r.listarPedidos({ rubros: yo.rubros, visorId: usuarioId }),
        ]);
        // En cuáles ya cotizó: cada proveedor solo puede leer su propia oferta.
        const mias = await Promise.all(pedidos.filter((p) => recibeOfertas(p)).map(async (p) => ((await r.cotizacionesDe(p.id)).some((c) => c.proveedorId === usuarioId) ? p.id : null)));
        return { yo, uso, embudo, enviadas, compradores, pedidos, cotizados: new Set(mias.filter(Boolean)) };
    }, [usuarioId]);
    if (!data)
        return _jsx("div", { className: "envoltura pagina" });
    const { yo, uso, embudo, enviadas, compradores, pedidos, cotizados } = data;
    // Lo que le da trabajo al proveedor va primero: abiertos sin cotizar, el que cierra antes arriba.
    const abiertos = pedidos.filter((p) => recibeOfertas(p)).sort((a, b) => a.cierraEn.localeCompare(b.cierraEn));
    const paraCotizar = abiertos.filter((p) => !cotizados.has(p.id));
    const yaCotizados = abiertos.length - paraCotizar.length;
    const plan = PLANES[yo.plan];
    const comp = (id) => compradores.find((c) => c.id === id);
    const contactados = new Set(enviadas.filter((s) => s.estado !== 'rechazada').map((s) => s.compradorId));
    const oportunidades = compradores.filter((c) => ventanaAbierta(c) && !contactados.has(c.id) && c.rubros.some((r) => yo.rubros.includes(r)));
    const etapas = [
        { k: 'Vistas de compradores', v: embudo.vistas },
        { k: 'Solicitudes enviadas', v: embudo.solicitudes },
        { k: 'Aceptadas', v: embudo.aceptadas },
        { k: 'Reuniones', v: embudo.reuniones },
        { k: 'Cotizaciones ganadas', v: embudo.ganadas },
    ];
    // Las barras se miden contra la etapa más grande: un comprador puede aceptar sin haber abierto el perfil.
    const maximo = Math.max(1, ...etapas.map((e) => e.v));
    const tasa = embudo.solicitudes ? Math.round((embudo.aceptadas / embudo.solicitudes) * 100) : 0;
    return (_jsxs("div", { className: "envoltura pagina panel", children: [_jsxs("header", { className: "panel__cab", children: [_jsxs("div", { children: [_jsxs("p", { className: "eyebrow", children: ["Panel de proveedor \u00B7 ", yo.empresa] }), _jsxs("h1", { children: ["Hola, ", cuenta?.miembro ? cuenta.miembro.nombre.split(" ")[0] : yo.nombre] })] }), _jsxs("div", { className: "plan-actual", children: [_jsxs("span", { children: ["Plan ", _jsx("strong", { children: plan.nombre })] }), _jsx(Medidor, { etiqueta: "Solicitudes de contacto este mes", usado: uso.solicitudesUsadas, total: plan.solicitudesMes }), _jsx(Medidor, { etiqueta: "Respuestas a pedidos", usado: uso.respuestasUsadas, total: plan.respuestasMes }), _jsx(Link, { to: "/planes", className: "enlace", children: "Cambiar de plan" })] })] }), _jsx(PrimerosPasos, { usuarioId: usuarioId, pasos: [
                    { hecho: !!yo.logo, texto: 'Subí el logo de tu empresa: es lo primero que ve el comprador.', a: '/perfil', accion: 'Ir a mi perfil' },
                    { hecho: cotizados.size > 0 || uso.respuestasUsadas > 0, texto: 'Cotizá tu primer pedido.', a: '/cotizaciones', accion: 'Ver pedidos' },
                    { hecho: enviadas.length > 0, texto: 'Pedile contacto a un comprador con ventana de compra abierta.', a: '/red', accion: 'Ver compradores' },
                ] }), _jsxs(Seccion, { titulo: `Para cotizar · ${paraCotizar.length}`, extra: _jsx(Link, { to: "/cotizaciones", className: "enlace", children: yaCotizados > 0 ? `Ver todos (ya cotizaste ${yaCotizados})` : 'Ver todos' }), children: [paraCotizar.length === 0 && (_jsx(Vacio, { titulo: abiertos.length ? 'Cotizaste todos los pedidos abiertos de tus rubros' : 'No hay pedidos abiertos en tus rubros', children: "Te avisamos por mail cuando se publique uno nuevo o cuando un comprador te invite." })), paraCotizar.map((p) => {
                        const dias = fmt.diasHasta(p.cierre);
                        return (_jsxs("div", { className: "fila-cotizar", children: [_jsxs(Link, { to: `/cotizaciones/${p.id}`, className: "fila-cotizar__txt", children: [_jsx("span", { className: "mono tenue", children: p.id }), " ", _jsx("strong", { children: p.titulo }), _jsxs("span", { className: "tenue bloque-linea", children: [p.items.length > 1 ? `${p.items.length} ítems` : `${fmt.numero(p.cantidad)} ${p.unidad}`, " \u00B7 ", p.zona || 'Sin zona', p.moneda === 'USD' && ' · en dólares', p.privado && ' · invitación'] })] }), _jsx(Pill, { tono: dias <= 2 ? 'senal' : 'neutro', children: dias <= 0 ? 'Cierra hoy' : dias === 1 ? 'Cierra mañana' : `Cierra en ${dias} días` }), _jsx(Link, { to: `/cotizaciones/${p.id}?cotizar=1`, className: "btn btn--pri btn--chico", children: "Cotizar" })] }, p.id));
                    })] }), _jsxs("div", { className: "panel__grilla", children: [_jsx("div", { className: "panel__col", children: _jsxs(Seccion, { titulo: "Compradores con ventana abierta en tus rubros", children: [oportunidades.length === 0 && _jsx(Vacio, { titulo: "Ya contactaste a todos los compradores activos de tus rubros" }), _jsx("div", { className: "pila", children: oportunidades.map((c) => (_jsxs("div", { className: "oportunidad", children: [_jsx(TarjetaComprador, { c: c, oculto: c.semiAnonimo }), _jsx("button", { className: "btn btn--pri btn--chico", onClick: () => setContactar(c), children: t.acciones.pedirContacto })] }, c.id))) })] }) }), _jsxs("div", { className: "panel__col", children: [_jsx(PedidosDeValor, {}), _jsxs(Seccion, { titulo: "Avisos de pedidos nuevos", children: [_jsxs("p", { className: "tenue", children: ["Te llegan a ", cuenta?.contacto.email, " los pedidos de tus rubros."] }), cuenta?.miembro ? _jsx("p", { className: "tenue", children: "Los avisos los configura el titular de la cuenta." }) : (_jsx("div", { className: "segmento segmento--ancho segmento--apilable", role: "group", "aria-label": "Frecuencia de avisos", children: [['inmediato', 'Un mail por pedido'], ['diario', 'Resumen diario'], ['pausado', 'Pausar']].map(([f, txt]) => (_jsx("button", { type: "button", "aria-pressed": yo.avisos === f, className: yo.avisos === f ? 'is-activo' : '', onClick: async () => { await repo.cambiarAvisos(usuarioId, f); avisar(f === 'pausado' ? 'Pausaste los avisos. Los pedidos siguen visibles en Cotizaciones.' : f === 'diario' ? 'Listo. Vas a recibir un resumen por día a las 8:00.' : 'Listo. Te escribimos apenas se publique un pedido de tu rubro.', 'info'); }, children: txt }, f))) }))] }), _jsxs(Seccion, { titulo: "Tus solicitudes", children: [enviadas.length === 0 && _jsx("p", { className: "tenue", children: "Todav\u00EDa no pediste contacto a ning\u00FAn comprador. Cuando lo hagas, ac\u00E1 ves si te acept\u00F3 y sus datos." }), enviadas.map((s) => {
                                        const c = comp(s.compradorId);
                                        const est = estadoVisibleParaProveedor(s.estado);
                                        const visible = !c.semiAnonimo || s.estado === 'aceptada';
                                        return (_jsxs("article", { className: "solicitud solicitud--enviada", children: [_jsxs("div", { className: "solicitud__cab", children: [_jsx(Avatar, { p: c, oculto: !visible }), _jsxs("div", { children: [_jsx(Link, { to: `/red/${c.id}`, children: _jsx("strong", { children: visible ? `${c.nombre} ${c.apellido}` : c.cargo }) }), _jsx("span", { className: "tenue bloque-linea", children: c.empresa })] }), _jsx(Pill, { tono: TONO[est], children: t.estado[est] })] }), s.estado === 'aceptada' && (_jsx("div", { className: "contacto contacto--plano", children: _jsx(ContactoPersona, { p: c, aceptado: true }) })), s.estado === 'aceptada' && (_jsxs("label", { className: "opcion opcion--inline", children: [_jsx("input", { type: "checkbox", checked: !!s.reunion, onChange: async (e) => {
                                                                try {
                                                                    await repo.marcarReunion(s.id, e.target.checked);
                                                                    avisar(e.target.checked ? 'Anotamos la reunión en tu embudo.' : 'Sacamos la reunión de tu embudo.', 'info');
                                                                }
                                                                catch {
                                                                    avisar('No se pudo guardar. Probá de nuevo.', 'error');
                                                                }
                                                            } }), _jsx("span", { children: "Tuvimos una reuni\u00F3n" })] })), est === 'cerrada' && _jsx("p", { className: "tenue", children: "Se cerr\u00F3 sin respuesta. Pod\u00E9s volver a intentar con otra propuesta." })] }, s.id));
                                    })] })] })] }), _jsx(Seccion, { titulo: "Tu embudo", extra: plan.analitica ? _jsxs(Pill, { tono: tasa >= 60 ? 'ok' : 'senal', children: [tasa, "% de aceptaci\u00F3n"] }) : undefined, children: _jsxs("div", { className: `embudo ${plan.analitica ? '' : 'is-bloqueado'}`, children: [etapas.map((e) => (_jsxs("div", { className: "embudo__etapa", children: [_jsx("span", { className: "embudo__v mono", children: fmt.numero(e.v) }), _jsx("span", { className: "embudo__barra", children: _jsx("span", { style: { width: `${Math.max(4, (e.v / maximo) * 100)}%` } }) }), _jsx("span", { className: "embudo__k", children: e.k })] }, e.k))), !plan.analitica && (_jsxs("div", { className: "embudo__candado", children: [_jsxs("p", { children: [_jsx("strong", { children: "La anal\u00EDtica del embudo est\u00E1 en Pro y Empresa." }), " Med\u00ED cu\u00E1ntas solicitudes se convierten en reuniones y en ventas."] }), _jsx(Link, { to: "/planes", className: "btn btn--pri btn--chico", children: "Ver planes" })] }))] }) }), contactar && _jsx(PedirContacto, { comprador: contactar, proveedorId: usuarioId, onCerrar: () => setContactar(null) })] }));
}
