import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { dolarOficial } from '@/data/dolar';
import { equivalente, otraMoneda } from '@/domain/moneda';
import { fmt } from '@/i18n';
/** Dólar oficial del día para la pantalla; null mientras carga o si la fuente no responde. */
export function useDolar(activo = true) {
    const [tc, setTc] = useState(null);
    useEffect(() => {
        if (!activo)
            return;
        let vivo = true;
        dolarOficial().then((x) => { if (vivo)
            setTc(x); });
        return () => { vivo = false; };
    }, [activo]);
    return tc;
}
/** "≈ $ 1.045.000 al dólar oficial BNA vendedor de $ 1.045 (31/10)". */
export function Equivalente({ monto, moneda, tc, corto = false }) {
    if (!tc || !(monto > 0))
        return null;
    const otra = otraMoneda(moneda);
    const valor = fmt.importe(equivalente(monto, moneda, tc), otra);
    if (corto)
        return _jsxs("span", { className: "tenue bloque-linea mono", title: `${tc.fuente}: ${fmt.importe(tc.valor, 'ARS')} el ${fmt.fecha(tc.fecha)}`, children: ["\u2248 ", valor] });
    return _jsxs("span", { className: "tenue", children: ["\u2248 ", _jsx("strong", { className: "mono", children: valor }), " al d\u00F3lar oficial BNA vendedor de ", fmt.importe(tc.valor, 'ARS'), " (", fmt.fecha(tc.fecha), ")"] });
}
