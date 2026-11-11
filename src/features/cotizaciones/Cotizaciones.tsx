import { Link, useSearchParams } from 'react-router-dom';
import { useSesion } from '@/app/session';
import { useQuery } from '@/data/DataProvider';
import { rubro } from '@/domain/catalogos';
import { horaDeCierre, recibeOfertas } from '@/domain/rfq';
import { ESTADOS_FILTRO, filtrarPedidos, hayFiltros, type EstadoFiltro, type FiltroPedidos } from '@/domain/pedidosProveedor';
import type { PedidoCotizacion, Persona, RubroId } from '@/domain/types';
import { FiltroRubro } from '@/ui/rubros';
import { fmt, t } from '@/i18n';
import { Pill, Vacio } from '@/ui/primitivas';
import { historialCsv } from '@/domain/exportar';
import { descargar } from '@/ui/descargar';

export function Cotizaciones() {
  const { rol, usuarioId } = useSesion();
  const { data } = useQuery(async (r) => {
    const yo = (await r.obtenerPersona(usuarioId)) as Persona;
    const pedidos = await r.listarPedidos(rol === 'comprador' ? { compradorId: usuarioId, visorId: usuarioId } : { visorId: usuarioId });
    // El proveedor ve todos los pedidos públicos de la red (de cualquier rubro) y sus invitaciones;
    // filtrar por sus rubros es opcional. Necesita saber en cuáles ya cotizó; el comprador ve el contador del pedido.
    const mias = rol === 'proveedor' ? await Promise.all(pedidos.map((p) => r.cotizacionesDe(p.id))) : [];
    const compradores = await r.listarCompradores();
    // Para el historial: solo los adjudicados, que ya tienen los precios abiertos.
    const adjudicados = rol === 'comprador' ? pedidos.filter((p) => p.estado === 'adjudicado') : [];
    const [provs, cotisAdj] = adjudicados.length
      ? await Promise.all([r.listarProveedores(), Promise.all(adjudicados.map((p) => r.cotizacionesDe(p.id)))])
      : [[], []];
    return {
      yo,
      provs,
      cotis: Object.fromEntries(adjudicados.map((p, i) => [p.id, cotisAdj[i]])),
      pedidos: pedidos.map((p, i) => ({ p, yaCotice: !!mias[i]?.some((c) => c.proveedorId === usuarioId), comprador: compradores.find((c) => c.id === p.compradorId) })),
    };
  }, [rol, usuarioId]);

  // Filtros del proveedor, en la URL para que sobrevivan al volver de un pedido. Sin filtros: todo.
  const [params, setParams] = useSearchParams();
  const filtro: FiltroPedidos = {
    estado: (params.get('ver') ?? 'todos') as EstadoFiltro,
    rubro: (params.get('rubro') || undefined) as RubroId | undefined,
    soloMios: params.get('mios') === '1',
    texto: params.get('q') ?? '',
  };
  const cambiar = (c: Partial<FiltroPedidos>) => {
    const n = { ...filtro, ...c };
    const q: Record<string, string> = {};
    if (n.estado && n.estado !== 'todos') q.ver = n.estado;
    if (n.rubro) q.rubro = n.rubro;
    if (n.soloMios) q.mios = '1';
    if (n.texto) q.q = n.texto;
    setParams(q, { replace: true });
  };
  const esProv = rol === 'proveedor';
  const res = data && esProv ? filtrarPedidos(data.pedidos, filtro, data.yo.rubros, usuarioId) : null;
  const visibles = res ? res.visibles : data?.pedidos ?? [];

  return (
    <div className="envoltura pagina">
      <header className="pagina__cab pagina__cab--fila">
        <div>
          <p className="eyebrow">Pedidos de cotización</p>
          <h1>{rol === 'comprador' ? 'Tus pedidos y las ofertas que recibiste' : 'Todos los pedidos de la red'}</h1>
        </div>
        {rol === 'comprador' && (
          <div className="acciones-fila">
            {data && visibles.length > 0 && (
              <button className="btn btn--sec" onClick={() => descargar('historial-de-pedidos.csv', historialCsv(
                data.pedidos.map((x) => x.p), data.cotis, (pid) => data.provs.find((p) => p.id === pid)?.empresa ?? pid, (id) => rubro(id).nombre,
              ))}>Descargar historial en Excel</button>
            )}
            <Link className="btn btn--pri" to="/cotizaciones/nuevo">Publicar pedido</Link>
          </div>
        )}
      </header>
      {res && data!.pedidos.length > 0 && (
        <div className="filtros-pedidos">
          <div className="filtros">
            <label className="campo campo--inline" htmlFor="ped-buscar">
              <span>Buscar</span>
              <input id="ped-buscar" type="search" placeholder="Título, zona o ítem" value={filtro.texto} onChange={(e) => cambiar({ texto: e.target.value })} />
            </label>
            <label className="opcion opcion--inline">
              <input type="checkbox" checked={!!filtro.soloMios} onChange={(e) => cambiar({ soloMios: e.target.checked })} />
              <span>Solo mis rubros e invitaciones</span>
            </label>
            {hayFiltros(filtro) && <button type="button" className="btn btn--ter btn--chico" onClick={() => setParams({}, { replace: true })}>Quitar filtros</button>}
          </div>
          <div className="segmento segmento--apilable" role="group" aria-label="Estado del pedido">
            {ESTADOS_FILTRO.map(([k, txt]) => (
              <button key={k} type="button" aria-pressed={filtro.estado === k} className={filtro.estado === k ? 'is-activo' : ''} onClick={() => cambiar({ estado: k })}>
                {txt} <span className="mono tenue">{res.conteo[k]}</span>
              </button>
            ))}
          </div>
          <FiltroRubro id="ped-rubro" valor={filtro.rubro} onCambio={(r) => cambiar({ rubro: r })} conDatos={data!.pedidos.map((x) => x.p.rubro)} />
        </div>
      )}
      {res && visibles.length === 0 && data!.pedidos.length > 0 && (
        <Vacio titulo="No hay pedidos con esos filtros">Probá con otro estado, otro rubro o quitá los filtros para ver todos.</Vacio>
      )}
      {data && data.pedidos.length === 0 && (
        <Vacio titulo={rol === 'comprador' ? 'Todavía no publicaste pedidos' : 'Todavía no hay pedidos publicados en la red'}>
          {rol === 'comprador' ? 'Publicá una necesidad y recibí ofertas comparables ítem por ítem.' : 'Te avisamos por mail cuando aparezca uno de tus rubros o cuando un comprador te invite.'}
        </Vacio>
      )}
      {data && visibles.length > 0 && (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr><th>Pedido</th><th>Rubro</th><th className="num">Cantidad</th><th>Cierra</th><th>{rol === 'comprador' ? 'Ofertas' : 'Comprador'}</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {visibles.map(({ p, yaCotice, comprador }) => (
                <Fila key={p.id} p={p} rol={rol} yaCotice={yaCotice} gane={!!p.adjudicados?.includes(usuarioId)}
                  comprador={!comprador ? '' : comprador.semiAnonimo ? `${comprador.cargo} · ${comprador.empresa}` : `${comprador.nombre} ${comprador.apellido} · ${comprador.empresa}`} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Fila({ p, rol, comprador, yaCotice, gane }: { p: PedidoCotizacion; rol: string; comprador: string; yaCotice: boolean; gane: boolean }) {
  const dias = fmt.diasHasta(p.cierre);
  const abierto = recibeOfertas(p);
  return (
    <tr>
      <td>
        <Link to={`/cotizaciones/${p.id}`} className="tabla__tit"><span className="mono tenue">{p.id}</span> {p.titulo}</Link>
        {p.privado && <> <Pill tono="sello">{rol === 'proveedor' ? 'Invitación' : 'Privado'}</Pill></>}
      </td>
      <td>{rubro(p.rubro).nombre}</td>
      <td className="num mono">{p.items.length > 1 ? `${p.items.length} ítems` : <>{fmt.numero(p.cantidad)} <span className="tenue">{p.unidad}</span></>}</td>
      <td>{fmt.fecha(p.cierre)} <span className="tenue mono">{horaDeCierre(p.cierraEn)}</span> {abierto && dias >= 0 && dias <= 7 && <Pill tono="senal">{dias === 0 ? 'hoy' : `${dias} d`}</Pill>}</td>
      <td>{rol === 'comprador' ? <span className="mono">{p.ofertas}</span> : comprador}</td>
      <td>
        {p.estado === 'adjudicado' && rol === 'proveedor' && yaCotice ? (gane ? <Pill tono="ok">Ganaste</Pill> : <Pill>No ganado</Pill>)
          : p.estado === 'adjudicado' ? <Pill tono="ok">{t.estado.adjudicado}</Pill>
          : rol === 'proveedor' && yaCotice ? <Pill tono="sello">{abierto ? 'Cotizaste' : 'Cotizaste · en evaluación'}</Pill>
          : rol === 'proveedor' && abierto ? <Link to={`/cotizaciones/${p.id}?cotizar=1`} className="btn btn--pri btn--chico">Cotizar</Link>
          : abierto ? <Pill>{t.estado.abierto}</Pill>
          : <Pill tono="senal">En evaluación</Pill>}
      </td>
    </tr>
  );
}
