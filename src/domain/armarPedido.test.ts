import { describe, expect, it } from 'vitest';
import { HERRAMIENTA, TEXTO_MAX, normalizarBorrador, promptSistema, validarTexto } from './armarPedido';
import { RUBROS } from './catalogos';
import { ITEMS_MAX } from './rfq';

const base = {
  rubro: 'limpieza', titulo: 'Limpieza de oficinas', descripcion: '',
  items: [{ nombre: 'Limpieza general', descripcion: '400 m², 3 veces por semana', cantidad: 48, unidad: 'horas operario' }],
  entrega: 'Oficina céntrica, desde el 1/12', zona: 'Rosario', documentos: ['Seguro de responsabilidad civil vigente'], dudas: [],
};

describe('validarTexto', () => {
  it('acepta una descripción razonable y la recorta', () => expect(validarTexto('  necesito limpieza para la oficina  ')).toBe('necesito limpieza para la oficina'));
  it('rechaza textos vacíos, muy cortos o muy largos', () => {
    expect(() => validarTexto('')).toThrow();
    expect(() => validarTexto(42)).toThrow();
    expect(() => validarTexto('cajas')).toThrow();
    expect(() => validarTexto('x'.repeat(TEXTO_MAX + 1))).toThrow();
  });
});

describe('normalizarBorrador', () => {
  it('deja pasar un borrador válido', () => {
    const b = normalizarBorrador(base);
    expect(b.rubro).toBe('limpieza');
    expect(b.items).toHaveLength(1);
    expect(b.items[0].cantidad).toBe(48);
    expect(b.dudas).toEqual([]);
  });
  it('rechaza rubros que no existen y respuestas sin ítems', () => {
    expect(() => normalizarBorrador({ ...base, rubro: 'astronautas' })).toThrow();
    expect(() => normalizarBorrador({ ...base, items: [] })).toThrow();
    expect(() => normalizarBorrador({ ...base, items: [{ nombre: '  ' }] })).toThrow();
    expect(() => normalizarBorrador(null)).toThrow();
    expect(() => normalizarBorrador('hola')).toThrow();
  });
  it('corrige cantidades inválidas y avisa que faltan', () => {
    const b = normalizarBorrador({ ...base, items: [{ nombre: 'A', cantidad: -3 }, { nombre: 'B', cantidad: '12' }, { nombre: 'C', cantidad: 'muchas' }] });
    expect(b.items.map((i) => i.cantidad)).toEqual([0, 12, 0]);
    expect(b.dudas[0]).toMatch(/ítems 1, 3/);
  });
  it('usa la unidad del rubro si falta y el primer ítem como título', () => {
    const b = normalizarBorrador({ ...base, titulo: '', items: [{ nombre: 'Vigilancia nocturna', cantidad: 10 }], rubro: 'seguridad' });
    expect(b.items[0].unidad).toBe('horas vigilador');
    expect(b.titulo).toBe('Vigilancia nocturna');
  });
  it('respeta los límites del formulario', () => {
    const muchos = Array.from({ length: ITEMS_MAX + 5 }, (_, n) => ({ nombre: `Ítem ${n}`, cantidad: 1, unidad: 'u' }));
    const b = normalizarBorrador({ ...base, titulo: 'x'.repeat(300), items: muchos, documentos: Array.from({ length: 20 }, (_, n) => `Doc ${n}`) });
    expect(b.items).toHaveLength(ITEMS_MAX);
    expect(b.titulo).toHaveLength(140);
    expect(b.documentos).toHaveLength(10);
  });
  it('ignora campos con tipos raros sin romperse', () => {
    const b = normalizarBorrador({ ...base, entrega: 5, zona: null, documentos: 'no es lista', dudas: [1, '', 'Revisar plazo'] });
    expect(b.entrega).toBe('');
    expect(b.zona).toBe('');
    expect(b.documentos).toEqual([]);
    expect(b.dudas).toEqual(['Revisar plazo']);
  });
});

describe('prompt y herramienta', () => {
  it('ofrecen todos los rubros del catálogo', () => {
    expect(HERRAMIENTA.input_schema.properties.rubro.enum).toEqual(RUBROS.map((r) => r.id));
    for (const r of RUBROS) expect(promptSistema()).toContain(`- ${r.id}:`);
  });
  it('incluye la fecha de hoy', () => expect(promptSistema(new Date('2026-11-18T12:00:00Z'))).toContain('2026-11-18'));
});
