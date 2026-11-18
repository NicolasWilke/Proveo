import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { leerDesvio } from '@/domain/indice';
import { fmt } from '@/i18n';
import { Pill } from '@/ui/primitivas';
const TEXTO = { debajo: 'debajo del índice', 'en-rango': 'en rango', arriba: 'arriba del índice' };
const TONO = { debajo: 'ok', 'en-rango': 'neutro', arriba: 'mal' };
export function LecturaIndice({ desvio }) {
    const l = leerDesvio(desvio);
    return _jsxs(Pill, { tono: TONO[l], children: [_jsx("span", { className: "mono", children: fmt.pct(desvio) }), " ", TEXTO[l]] });
}
