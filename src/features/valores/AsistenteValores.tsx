import { useState } from 'react';
import { llamarIA, useIAActiva } from '@/app/ia';
import { evento } from '@/app/medicion';
import { region as regionDe } from '@/domain/catalogos';
import type { ValorReferencia } from '@/domain/types';
import {
  TEXTO_MAX, TEXTO_MIN, aCatalogo, cantidadDe, comparar,
  type Adaptacion, type Explicacion,
} from '@/domain/valoresIA';
import { fmt } from '@/i18n';

/**
 * IA en la calculadora de valores de referencia. La IA no pone precios:
 *  - "Adaptar a mi pedido": elige un valor ya cargado y desarma la cantidad; la cuenta la hace la app.
 *  - "Comparar una cotización": dónde cae lo calcula la app; la IA solo explica posibles motivos, sin montos.
 */
const URL_IA = '/api/valores-ia';
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const mes = (iso = '') => (iso ? `${MES[Number(iso.slice(5, 7)) - 1]}-${iso.slice(2, 4)}` : '');
const nombreRegion = (r: ValorReferencia['region'] | '') => (!r ? '' : r === 'nacional' ? 'Nacional' : regionDe(r).nombre);
const num = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 2 });

/** De dónde sale el número: se muestra siempre junto a lo que calcula la IA. */
export function FuenteDelValor({ v }: { v: ValorReferencia }) {
  const tipo = v.fuente === 'convenio' ? 'Convenio colectivo' : v.fuente === 'estimado' ? 'Estimado' : v.fuente === 'arancel' ? 'Arancel profesional' : v.fuente === 'cotizaciones' ? 'Cotizaciones de la red' : 'Sin fuente cargada';
  return (
    <p className="tenue asistente-ia__fuente">
      <strong>De dónde sale:</strong> {v.concepto} ({nombreRegion(v.region)}) · {tipo}{v.fuenteDetalle ? `: ${v.fuenteDetalle}` : ''}{v.fecha ? ` · ${mes(v.fecha)}` : ''}
    </p>
  );
}

export function AdaptarConIA({ valores, onAdaptar }: {
  /** Todos los valores (sin filtrar): la IA elige solo entre los que tienen número cargado. */
  valores: ValorReferencia[];
  onAdaptar: (valorId: string, cantidad: number) => void;
}) {
  const activa = useIAActiva(URL_IA);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [res, setRes] = useState<Adaptacion | null>(null);

  if (!activa) return null;
  const elegido = res ? valores.find((v) => v.id === res.valorId) : undefined;
  const cantidad = res ? cantidadDe(res.factores) : 0;

  const adaptar = async () => {
    setError(''); setRes(null); setCargando(true);
    try {
      const d = await llamarIA<{ adaptacion?: Adaptacion }>(URL_IA, { modo: 'adaptar', texto: texto.trim(), catalogo: aCatalogo(valores) });
      if (!d.adaptacion) throw new Error('La IA no respondió. Probá de nuevo.');
      const a = d.adaptacion;
      setRes(a);
      evento('valores_adaptados_ia', { encontrado: Boolean(a.valorId), factores: a.factores.length });
      if (a.valorId) onAdaptar(a.valorId, cantidadDe(a.factores));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'La IA no respondió. Probá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="asistente-ia" aria-labelledby="adaptar-ia-tit">
      <label className="campo" htmlFor="adaptar-ia-texto">
        <span id="adaptar-ia-tit"><strong>Adaptalo a tu pedido.</strong> Contalo con tus palabras y la IA elige el valor que corresponde y arma la cantidad. Los precios salen de los valores cargados, nunca de la IA.</span>
        <textarea id="adaptar-ia-texto" rows={3} maxLength={TEXTO_MAX} value={texto} onChange={(e) => setTexto(e.target.value)}
          placeholder="Ej.: 2 vigiladores para la planta de Rosario, 12 horas por día, todos los días del mes." />
      </label>
      <button type="button" className="btn btn--sec btn--chico" disabled={cargando || texto.trim().length < TEXTO_MIN} onClick={adaptar}>
        {cargando ? 'Calculando…' : 'Calcular con IA'}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
      {res && !elegido && (
        <p className="nota" role="status">No hay un valor cargado que corresponda a ese pedido todavía. Preferimos no inventar uno: publicá el pedido y compará las cotizaciones que lleguen.</p>
      )}
      {res && elegido && (
        <div className="asistente-ia__res" role="status">
          {res.factores.length > 0 ? (
            <p><strong>Cantidad:</strong> {res.factores.map((f) => `${num(f.cantidad)} ${f.que}`).join(' × ')} = <strong className="mono">{num(cantidad)} {elegido.unidad === 'hora' ? 'horas' : elegido.unidad}</strong></p>
          ) : (
            <p><strong>Cantidad:</strong> no se puede saber con lo que contaste. Cargala a mano en la calculadora.</p>
          )}
          <FuenteDelValor v={elegido} />
          {res.region && elegido.region !== res.region && (
            <p className="nota">No hay valores propios de {nombreRegion(res.region)} para esto: se usa el {elegido.region === 'nacional' ? 'nacional' : `de ${nombreRegion(elegido.region)}`}.</p>
          )}
          {res.supuestos.length > 0 && <p className="tenue"><strong>Supuso:</strong> {res.supuestos.join(' · ')}</p>}
          {res.faltantes.length > 0 && <ul className="asistente-ia__lista">{res.faltantes.map((f) => <li key={f}>{f}</li>)}</ul>}
        </div>
      )}
    </section>
  );
}

const UBICACION = { debajo: 'por debajo del rango', dentro: 'dentro del rango', arriba: 'por encima del rango' } as const;

export function CompararCotizacion({ v, ajustado }: { v: ValorReferencia; ajustado: boolean }) {
  const activa = useIAActiva(URL_IA);
  const [precio, setPrecio] = useState('');
  const [incluye, setIncluye] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exp, setExp] = useState<{ para: string; e: Explicacion } | null>(null);

  const p = Number(precio) || 0;
  const c = p > 0 ? comparar(p, v) : null;
  const clave = `${v.id}|${p}|${incluye.trim()}`;
  const vigente = exp && exp.para === clave ? exp.e : null;

  const explicar = async () => {
    setError(''); setCargando(true);
    try {
      const d = await llamarIA<{ explicacion?: Explicacion }>(URL_IA, {
        modo: 'explicar', precio: p, incluye: incluye.trim(),
        valor: { concepto: v.concepto, unidad: v.unidad, region: v.region, fuente: v.fuente, fuenteDetalle: v.fuenteDetalle, fecha: v.fecha, min: v.min, mediana: v.mediana, max: v.max, ajustadoPorInflacion: ajustado },
      });
      if (!d.explicacion) throw new Error('La IA no respondió. Probá de nuevo.');
      setExp({ para: clave, e: d.explicacion });
      evento('cotizacion_explicada_ia', { ubicacion: c?.ubicacion ?? '' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'La IA no respondió. Probá de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <section className="asistente-ia" aria-labelledby="comparar-tit">
      <h3 id="comparar-tit" className="asistente-ia__tit">¿Te llegó una cotización?</h3>
      <label className="campo" htmlFor="comparar-precio">
        <span>Precio cotizado por {v.unidad}, sin IVA</span>
        <input id="comparar-precio" type="number" min={0} className="mono" value={precio} onChange={(e) => setPrecio(e.target.value)} />
      </label>
      {c && (
        <p role="status">
          Está <strong>{UBICACION[c.ubicacion]}</strong>: {fmt.pct(c.vsMediana)} contra la mediana ({fmt.moneda(v.mediana)}).
          {v.fuente === 'estimado' && ' Ojo: este rango es una estimación, no precios relevados.'}
          {v.fuente === 'convenio' && ' Ojo: este valor es de convenio (lo que cobra el trabajador), no el precio de una empresa.'}
        </p>
      )}
      {activa && c && (
        <>
          <label className="campo" htmlFor="comparar-incluye">
            <span>¿Qué dice que incluye? (opcional)</span>
            <textarea id="comparar-incluye" rows={2} maxLength={TEXTO_MAX} value={incluye} onChange={(e) => setIncluye(e.target.value)}
              placeholder="Ej.: incluye insumos y supervisor, no incluye uniformes." />
          </label>
          <button type="button" className="btn btn--sec btn--chico" disabled={cargando} onClick={explicar}>
            {cargando ? 'Pensando…' : 'Explicame la diferencia'}
          </button>
        </>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      {vigente && (
        <div className="asistente-ia__res" role="status">
          {vigente.lectura && <p>{vigente.lectura}</p>}
          {vigente.motivos.length > 0 && <><p className="etq">Motivos posibles</p><ul className="asistente-ia__lista">{vigente.motivos.map((m) => <li key={m}>{m}</li>)}</ul></>}
          {vigente.preguntas.length > 0 && <><p className="etq">Preguntale al proveedor</p><ul className="asistente-ia__lista">{vigente.preguntas.map((m) => <li key={m}>{m}</li>)}</ul></>}
          <FuenteDelValor v={v} />
          <p className="nota">Explicación generada por IA a partir de este valor y lo que cargaste. No agrega precios.</p>
        </div>
      )}
    </section>
  );
}
