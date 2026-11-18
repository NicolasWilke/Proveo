import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useState } from 'react';
const Ctx = createContext(() => { });
export function ToastProvider({ children }) {
    const [items, setItems] = useState([]);
    const avisar = useCallback((texto, tono = 'ok') => {
        const id = Date.now() + Math.random();
        setItems((xs) => [...xs, { id, texto, tono }]);
        setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4200);
    }, []);
    return (_jsxs(Ctx.Provider, { value: avisar, children: [children, _jsx("div", { className: "toasts", role: "status", "aria-live": "polite", children: items.map((x) => _jsx("div", { className: `toast toast--${x.tono}`, children: x.texto }, x.id)) })] }));
}
export const useToast = () => useContext(Ctx);
