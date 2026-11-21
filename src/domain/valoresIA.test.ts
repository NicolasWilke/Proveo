import { describe, expect, it } from 'vitest';
import { valores } from '@/data/valores-referencia';
import {
  aCatalogo, cantidadDe, comparar, esquemaAdaptar, instruccionesAdaptar, instruccionesExplicar,
  normalizarAdaptacion, normalizarExplicacion, sinMontos, validarExplicar,
} from './valoresIA';

describe('IA en valores de referencia', () => {
  it('el catálogo que ve la IA no lleva precios y solo trae valores cargados', () => {
    const cat = aCatalogo(valores);
    expect(cat.length).toBe(valores.filter((v) => v.max > 0).length);
    for (const i of cat) expect(Object.keys(i).sort()).toEqual(['concepto', 'id', 'region', 'rubro', 'unidad']);
  });

  it('el esquema solo permite ids del catálogo (o ninguno)', () => {
    expect(esquemaAdaptar(['a', 'b']).properties.valorId.enum).toEqual(['a', 'b', '']);
  });

  it('las instrucciones no cambian entre llamadas (caché)', () => {
    expect(instruccionesAdaptar()).toBe(instruccionesAdaptar());
    expect(instruccionesExplicar()).toBe(instruccionesExplicar());
  });

  it('la cantidad la calcula el código multiplicando los factores', () => {
    const a = normalizarAdaptacion({
      valorId: 'limp-operario-precio', region: 'ros', supuestos: ['22 días hábiles por mes'], faltantes: [],
      factores: [{ cantidad: 3, que: 'operarios' }, { cantidad: 8, que: 'horas por día' }, { cantidad: 22, que: 'días hábiles' }],
    }, ['limp-operario-precio']);
    expect(a.valorId).toBe('limp-operario-precio');
    expect(a.region).toBe('ros');
    expect(cantidadDe(a.factores)).toBe(528);
  });

  it('descarta ids inventados, factores inválidos y regiones fuera de lista', () => {
    const a = normalizarAdaptacion({
      valorId: 'inventado', region: 'marte', supuestos: ['cuesta $ 12.000 la hora'], faltantes: ['¿Cuántas horas?'],
      factores: [{ cantidad: -1, que: 'x' }, { cantidad: 4, que: '' }, { cantidad: 2, que: 'personas' }],
    }, ['limp-operario-precio']);
    expect(a.valorId).toBe('');
    expect(a.region).toBe('');
    expect(a.factores).toEqual([{ cantidad: 2, que: 'personas' }]);
    expect(a.supuestos).toEqual([]);
    expect(a.faltantes).toEqual(['¿Cuántas horas?']);
    expect(cantidadDe([])).toBe(0);
  });

  it('compara una cotización contra el rango sin IA', () => {
    const v = { min: 100, mediana: 120, max: 150 };
    expect(comparar(90, v).ubicacion).toBe('debajo');
    expect(comparar(132, v)).toMatchObject({ ubicacion: 'dentro', vsMediana: 10 });
    expect(comparar(180, v).ubicacion).toBe('arriba');
  });

  it('borra de la explicación toda frase con montos o porcentajes', () => {
    expect(sinMontos('Puede incluir insumos y supervisión.')).toBe(true);
    expect(sinMontos('El CCT 507/07 fija el básico.')).toBe(true);
    expect(sinMontos('Debería costar $ 15.000.')).toBe(false);
    expect(sinMontos('Está 20 % arriba.')).toBe(false);
    expect(sinMontos('Unos 18.000 por hora.')).toBe(false);
    const e = normalizarExplicacion({
      lectura: 'Está arriba del rango. Lo normal serían $ 16.500. La fuente es una estimación.',
      motivos: ['Incluye insumos', 'Cobra 30% más por nocturnidad'], preguntas: ['¿El precio incluye IVA?'],
    });
    expect(e.lectura).toBe('Está arriba del rango. La fuente es una estimación.');
    expect(e.motivos).toEqual(['Incluye insumos']);
    expect(e.preguntas).toEqual(['¿El precio incluye IVA?']);
  });

  it('valida lo que llega para explicar y recalcula la comparación en el servidor', () => {
    expect(validarExplicar({ precio: 0, valor: { concepto: 'x', min: 1, mediana: 2, max: 3 } })).toBeNull();
    expect(validarExplicar({ precio: 5, valor: { min: 1, mediana: 2, max: 3 } })).toBeNull();
    const p = validarExplicar({ precio: 5, incluye: 'todo', comparacion: { ubicacion: 'dentro' }, valor: { concepto: 'Operario', unidad: 'hora', min: 1, mediana: 2, max: 3, fuente: 'otra' } });
    expect(p?.comparacion.ubicacion).toBe('arriba');
    expect(p?.valor.fuente).toBeUndefined();
  });
});
