import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GRUPOS_RUBRO, RUBROS, RUBROS_POR_GRUPO } from './catalogos';

describe('catálogo de rubros', () => {
  it('no repite ids ni nombres', () => {
    expect(new Set(RUBROS.map((r) => r.id)).size).toBe(RUBROS.length);
    expect(new Set(RUBROS.map((r) => r.nombre)).size).toBe(RUBROS.length);
  });

  it('cada rubro está en un grupo conocido y ningún grupo queda vacío', () => {
    expect(RUBROS.every((r) => (GRUPOS_RUBRO as readonly string[]).includes(r.grupo))).toBe(true);
    expect(RUBROS_POR_GRUPO.every((g) => g.rubros.length > 0)).toBe(true);
    expect(RUBROS_POR_GRUPO.flatMap((g) => g.rubros).length).toBe(RUBROS.length);
  });

  it('las reglas de Firestore aceptan exactamente los mismos rubros', () => {
    const reglas = readFileSync(new URL('../../firebase/firestore.rules', import.meta.url), 'utf8');
    const lista = /function rubroValido\(r\) \{\s*return r in \[([^\]]+)\]/.exec(reglas)?.[1] ?? '';
    const enReglas = [...lista.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
    expect(enReglas).toEqual(RUBROS.map((r) => r.id).sort());
  });
});
