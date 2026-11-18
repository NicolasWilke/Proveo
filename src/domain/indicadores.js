import { ReglaDeNegocioError } from './reglas';
/**
 * Cálculos del Centro de referencias (sección 8 del documento). Todo sale de la serie de cada indicador:
 * nunca se suman porcentajes mensuales, se componen.
 */
export const DIVISOR_HORAS = 200;
/** Si la variación mensual se aparta más de esto de la del mes anterior, se pide confirmar el dato. */
export const SALTO_SOSPECHOSO = 3;
export const ESCENARIOS = { bajo: 1.5, base: 1.9, alto: 2.5 };
export const periodoValido = (p) => /^\d{4}-(0[1-9]|1[0-2])$/.test(p);
export function sumarMeses(periodo, n) {
    const [y, m] = periodo.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    return d.toISOString().slice(0, 7);
}
export const valorEn = (i, periodo) => i.serie.find((p) => p.periodo === periodo)?.valor;
/** Último dato publicado (no cuenta los aumentos pactados a futuro). */
export const ultimo = (i) => [...i.serie].reverse().find((p) => !p.pactado);
const variacion = (a, b) => (a && b ? (b / a - 1) * 100 : null);
export const mensual = (i, periodo) => variacion(valorEn(i, sumarMeses(periodo, -1)), valorEn(i, periodo));
export const interanual = (i, periodo) => variacion(valorEn(i, sumarMeses(periodo, -12)), valorEn(i, periodo));
/** Contra diciembre del año anterior. */
export const acumuladoAnio = (i, periodo) => variacion(valorEn(i, `${Number(periodo.slice(0, 4)) - 1}-12`), valorEn(i, periodo));
export const entre = (i, desde, hasta) => variacion(valorEn(i, desde), valorEn(i, hasta));
/** Monto actualizado = monto × (índice final ÷ índice inicial). */
export function actualizarMonto(monto, i, desde, hasta) {
    const a = valorEn(i, desde);
    const b = valorEn(i, hasta);
    return a && b ? monto * (b / a) : null;
}
/** Valor proyectado = valor × (1 + tasa mensual)^n. */
export const proyectar = (valor, tasaMensual, meses) => valor * (1 + tasaMensual / 100) ** meses;
export const acumuladoProyectado = (tasaMensual, meses) => ((1 + tasaMensual / 100) ** meses - 1) * 100;
export const valorHora = (mensual, divisor = DIVISOR_HORAS) => (mensual ? mensual / divisor : null);
/** Cláusula de ajuste ponderada: Σ peso × variación de cada componente. Los pesos suman 100. */
export function ajustePonderado(componentes) {
    const total = componentes.reduce((a, c) => a + c.peso, 0);
    if (Math.abs(total - 100) > 0.01)
        throw new ReglaDeNegocioError('INDICADOR_INVALIDO', `Los pesos tienen que sumar 100 (suman ${total}).`);
    return componentes.reduce((a, c) => a + (c.peso / 100) * c.variacion, 0);
}
/** Meses en que el indicador y el otro tienen dato, para elegir períodos en la calculadora. */
export const periodos = (i) => i.serie.map((p) => p.periodo);
/** Valida un dato nuevo antes de publicarlo. Devuelve un aviso si el salto es raro (no lo bloquea). */
export function validarPunto(i, p) {
    const invalido = (m) => new ReglaDeNegocioError('INDICADOR_INVALIDO', m);
    if (!periodoValido(p.periodo))
        throw invalido('El período va como año-mes, por ejemplo 2026-10.');
    if (!(p.valor > 0))
        throw invalido('El valor tiene que ser mayor que cero.');
    if (i.serie.some((x) => x.periodo === p.periodo && !x.pactado))
        throw invalido(`Ya hay un dato publicado para ${p.periodo}. Corregilo en la tabla.`);
    const con = { serie: [...i.serie.filter((x) => x.periodo !== p.periodo), p] };
    const nueva = mensual(con, p.periodo);
    const previa = mensual(con, sumarMeses(p.periodo, -1));
    if (nueva !== null && previa !== null && Math.abs(nueva - previa) > SALTO_SOSPECHOSO) {
        const f = (n) => `${n.toFixed(1).replace('.', ',')} %`;
        return `La variación mensual (${f(nueva)}) se aparta más de ${SALTO_SOSPECHOSO} puntos de la del mes anterior (${f(previa)}). Revisá el dato con la fuente.`;
    }
    return null;
}
/** Inserta o reemplaza el dato del período y deja la serie ordenada. */
export const conPunto = (serie, p) => [...serie.filter((x) => x.periodo !== p.periodo), p].sort((a, b) => a.periodo.localeCompare(b.periodo));
/**
 * Proyecta mes a mes desde el último dato publicado. Si hay aumentos ya pactados en paritarias se usan esos
 * valores, y recién después se aplica la tasa supuesta.
 */
export function proyectarSerie(i, tasaMensual, meses) {
    const u = ultimo(i);
    if (!u)
        return [];
    const out = [];
    let valor = u.valor;
    for (let n = 1; n <= meses; n++) {
        const periodo = sumarMeses(u.periodo, n);
        const pactado = i.serie.find((p) => p.periodo === periodo && p.pactado);
        valor = pactado ? pactado.valor : valor * (1 + tasaMensual / 100);
        out.push({ periodo, valor, pactado: !!pactado });
    }
    return out;
}
/** Datos con más de 45 días sin cargar se marcan en rojo. */
export const DIAS_ATRASO = 45;
export const atrasado = (i, hoy = new Date()) => (hoy.getTime() - new Date(`${i.actualizado}T12:00:00Z`).getTime()) / 86400000 > DIAS_ATRASO;
