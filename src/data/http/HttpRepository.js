/**
 * Esqueleto de la implementación contra la API real. Cada método mapea a un
 * endpoint REST; las reglas de dominio (src/domain/reglas.ts) se ejecutan
 * también en el servidor, que es la fuente de verdad.
 */
export function crearHttpRepository(baseUrl) {
    const pedir = async (ruta, init) => {
        const r = await fetch(`${baseUrl}${ruta}`, {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            ...init,
        });
        if (!r.ok)
            throw new Error((await r.json().catch(() => null))?.mensaje ?? `Error ${r.status}`);
        return r.status === 204 ? undefined : r.json();
    };
    const qs = (o = {}) => {
        const p = new URLSearchParams(Object.entries(o).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)]));
        return p.toString() ? `?${p}` : '';
    };
    const post = (body) => ({ method: 'POST', body: JSON.stringify(body) });
    const oyentes = new Set();
    const tocar = (x) => { oyentes.forEach((f) => f()); return x; };
    return {
        listarCompradores: (f) => pedir(`/compradores${qs(f)}`),
        listarProveedores: (f) => pedir(`/proveedores${qs(f)}`),
        obtenerPersona: (id) => pedir(`/personas/${id}`),
        sincronizarCuenta: (c) => pedir(`/personas/${c.uid}`, { method: 'PUT', body: JSON.stringify(c) }).then(tocar),
        solicitudesRecibidas: (id) => pedir(`/compradores/${id}/solicitudes`),
        solicitudesEnviadas: (id) => pedir(`/proveedores/${id}/solicitudes`),
        enviarSolicitud: (proveedorId, compradorId, motivo) => pedir('/solicitudes', post({ proveedorId, compradorId, motivo })).then(tocar),
        responderSolicitud: (id, estado) => pedir(`/solicitudes/${id}`, { method: 'PATCH', body: JSON.stringify({ estado }) }).then(tocar),
        listarPedidos: (f) => pedir(`/pedidos${qs({ compradorId: f?.compradorId, rubros: f?.rubros?.join(',') })}`),
        obtenerPedido: (id) => pedir(`/pedidos/${id}`),
        publicarPedido: (p) => pedir('/pedidos', post(p)).then(tocar),
        cotizacionesDe: (id) => pedir(`/pedidos/${id}/cotizaciones`),
        cotizar: (c) => pedir(`/pedidos/${c.pedidoId}/cotizaciones`, post(c)).then(tocar),
        adjudicar: (pedidoId, asignacion, comentario, listar = true) => pedir(`/pedidos/${pedidoId}/adjudicacion`, post({ asignacion, comentario, listar })).then(tocar),
        antecedentes: () => pedir('/antecedentes'),
        solicitarValor: (antecedenteId, _c, cantidad, mensaje) => pedir(`/antecedentes/${antecedenteId}/solicitudes`, post({ cantidad, mensaje })).then(tocar),
        solicitudesValor: (f) => pedir(`/solicitudes-valor?${new URLSearchParams(f)}`),
        responderValor: (id, respuesta) => pedir(`/solicitudes-valor/${id}`, { method: 'PUT', body: JSON.stringify(respuesta ?? { declinada: true }) }).then(tocar),
        consultasDe: (id) => pedir(`/pedidos/${id}/consultas`),
        preguntar: (id, pregunta) => pedir(`/pedidos/${id}/consultas`, post({ pregunta })).then(tocar),
        responderConsulta: (id, cid, respuesta) => pedir(`/pedidos/${id}/consultas/${cid}`, { method: 'PUT', body: JSON.stringify({ respuesta }) }).then(tocar),
        favoritos: (id) => pedir(`/compradores/${id}/favoritos`),
        marcarFavorito: (id, prov, favorito) => pedir(`/compradores/${id}/favoritos/${prov}`, { method: favorito ? 'PUT' : 'DELETE' }).then(tocar),
        avisosDePedido: (id) => pedir(`/pedidos/${id}/avisos`),
        cambiarAvisos: (id, frecuencia) => pedir(`/proveedores/${id}/avisos`, { method: 'PUT', body: JSON.stringify({ frecuencia }) }).then(tocar),
        bandejaSalida: async () => [],
        enviarResumenesAhora: async () => 0,
        valoresReferencia: () => pedir('/valores-referencia'),
        guardarValor: (v) => pedir(`/valores-referencia/${v.id}`, { method: 'PUT', body: JSON.stringify(v) }).then(tocar),
        indicadores: () => pedir('/indicadores'),
        guardarIndicador: (i) => pedir(`/indicadores/${i.id}`, { method: 'PUT', body: JSON.stringify(i) }).then(tocar),
        guardarEscala: (e) => pedir(`/escalas/${e.id}`, { method: 'PUT', body: JSON.stringify(e) }).then(tocar),
        equipo: (id) => pedir(`/proveedores/${id}/equipo`),
        invitarAlEquipo: (id, etiqueta) => pedir(`/proveedores/${id}/equipo/invitaciones`, post({ etiqueta })).then(tocar),
        cancelarInvitacion: (codigo) => pedir(`/invitaciones/${codigo}`, { method: 'DELETE' }).then(tocar),
        quitarDelEquipo: (id, uid) => pedir(`/proveedores/${id}/equipo/${uid}`, { method: 'DELETE' }).then(tocar),
        cuentasAdmin: () => pedir('/admin/cuentas'),
        activarPlan: (uid, plan) => pedir(`/admin/cuentas/${uid}/plan`, post({ plan })).then(tocar),
        descartarPedidoPlan: (uid) => pedir(`/admin/cuentas/${uid}/pedido-plan`, { method: 'DELETE' }).then(tocar),
        verificarCuenta: (uid, verificado) => pedir(`/admin/cuentas/${uid}/verificacion`, post({ verificado })).then(tocar),
        esAdmin: async (uid) => (await pedir(`/cuentas/${uid}/admin`)).admin,
        resenasDePedido: (id) => pedir(`/pedidos/${id}/resenas`),
        resenar: (id, proveedorId, datos) => pedir(`/pedidos/${id}/resenas`, post({ proveedorId, ...datos })).then(tocar),
        indicePrecios: () => pedir('/indice-precios'),
        uso: (id) => pedir(`/proveedores/${id}/uso`),
        cambiarPlan: (id, plan) => pedir(`/proveedores/${id}/plan`, post({ plan })).then(tocar),
        embudo: (id) => pedir(`/proveedores/${id}/embudo`),
        registrarVista: (id) => pedir(`/proveedores/${id}/vistas`, post({})),
        marcarReunion: (id, hubo) => pedir(`/solicitudes/${id}/reunion`, post({ hubo })).then(tocar),
        enListaEspera: async (id) => (await pedir(`/compradores/${id}/lista-espera`)).anotado,
        sumarseListaEspera: (id, empresa) => pedir(`/compradores/${id}/lista-espera`, post({ empresa })).then(tocar),
        listaEspera: () => pedir('/admin/lista-espera'),
        cambiarRegiones: (id, extra) => pedir(`/proveedores/${id}/regiones`, post({ extra })).then(tocar),
        reiniciarDemo: async () => undefined,
        suscribir: (fn) => { oyentes.add(fn); return () => { oyentes.delete(fn); }; },
    };
}
