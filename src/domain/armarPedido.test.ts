import { describe, expect, it } from 'vitest';
import { ESQUEMA_BORRADOR, instrucciones, normalizarBorrador } from './armarPedido';
import { RUBROS } from './catalogos';
import { ITEMS_MAX } from './rfq';

describe('armar pedido con IA', () => {
  it('las instrucciones y el esquema nombran todos los rubros', () => {
    const texto = instrucciones();
    for (const r of RUBROS) expect(texto).toContain(`- ${r.id}:`);
    expect(ESQUEMA_BORRADOR.properties.rubro.enum).toEqual(RUBROS.map((r) => r.id));
  });

  it('las instrucciones no cambian entre llamadas (caché)', () => {
    expect(instrucciones()).toBe(instrucciones());
  });

  it('limpia un borrador válido sin tocar lo que está bien', () => {
    const b = normalizarBorrador({
      rubro: 'limpieza', titulo: '  Limpieza de oficinas  ', descripcion: 'Lunes a viernes.',
      items: [{ nombre: 'Limpieza diaria', descripcion: '', cantidad: 80, unidad: 'horas operario' }],
      entrega: '', zona: 'Rosario', documentos: ['Seguro de responsabilidad civil vigente'], faltantes: ['¿Cuántos m²?'],
    });
    expect(b.rubro).toBe('limpieza');
    expect(b.titulo).toBe('Limpieza de oficinas');
    expect(b.items).toEqual([{ nombre: 'Limpieza diaria', descripcion: '', cantidad: 80, unidad: 'horas operario' }]);
    expect(b.documentos).toEqual(['Seguro de responsabilidad civil vigente']);
    expect(b.faltantes).toEqual(['¿Cuántos m²?']);
  });

  it('descarta lo que está fuera de catálogo o no tiene sentido', () => {
    const b = normalizarBorrador({
      rubro: 'inventado', titulo: 'x'.repeat(500),
      items: [{ nombre: '', cantidad: 3 }, { nombre: 'Guantes', cantidad: -2, unidad: '' }, { nombre: 'Cascos', cantidad: Number.NaN }],
      documentos: ['Partida de nacimiento'], faltantes: ['a', 'b', 'c', 'd', 'e'],
    });
    expect(b.rubro).toBe(RUBROS[0].id);
    expect(b.titulo).toHaveLength(140);
    expect(b.items.map((i) => [i.nombre, i.cantidad, i.unidad])).toEqual([['Guantes', 0, RUBROS[0].unidad], ['Cascos', 0, RUBROS[0].unidad]]);
    expect(b.documentos).toEqual([]);
    expect(b.faltantes).toHaveLength(4);
  });

  it('no pasa del máximo de ítems y aguanta basura', () => {
    const muchos = Array.from({ length: ITEMS_MAX + 5 }, (_, n) => ({ nombre: `Ítem ${n}`, descripcion: '', cantidad: 1, unidad: 'u' }));
    expect(normalizarBorrador({ rubro: 'epp', items: muchos }).items).toHaveLength(ITEMS_MAX);
    expect(normalizarBorrador(null).items).toEqual([]);
    expect(normalizarBorrador('texto').titulo).toBe('');
  });
});
