import { RUBROS, RUBROS_POR_GRUPO } from '@/domain/catalogos';
import type { RubroId } from '@/domain/types';
import { Chip } from './primitivas';

/** Opciones agrupadas para un `<select>` de rubro. */
export function OpcionesRubro() {
  return <>{RUBROS_POR_GRUPO.map(({ grupo, rubros }) => (
    <optgroup key={grupo} label={grupo}>
      {rubros.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
    </optgroup>
  ))}</>;
}

/**
 * Filtro por rubro: como chips solo van los rubros que tienen algo para mostrar (más el elegido),
 * y el resto se elige en un desplegable. Con ~40 rubros, una fila de chips con todos no se puede leer.
 */
export function FiltroRubro({ valor, onCambio, conDatos, id }: { valor?: RubroId; onCambio: (r?: RubroId) => void; conDatos: Iterable<RubroId>; id: string }) {
  const hay = new Set(conDatos);
  if (valor) hay.add(valor);
  const chips = RUBROS.filter((r) => hay.has(r.id));
  return (
    <div className="chips chips--filtro">
      <Chip activo={!valor} onClick={() => onCambio(undefined)}>Todos los rubros</Chip>
      {chips.map((r) => <Chip key={r.id} activo={valor === r.id} onClick={() => onCambio(r.id)}>{r.nombre}</Chip>)}
      <select id={id} className="filtro-rubro" aria-label="Elegir rubro" value={valor ?? ''} onChange={(e) => onCambio((e.target.value || undefined) as RubroId | undefined)}>
        <option value="">Más rubros…</option>
        <OpcionesRubro />
      </select>
    </div>
  );
}
