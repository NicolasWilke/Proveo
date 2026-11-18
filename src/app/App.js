import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { AuthProvider } from '@/auth/AuthProvider';
import { crearRepositorio } from '@/data';
import { DataProvider } from '@/data/DataProvider';
import { ToastProvider } from '@/ui/Toast';
import { AppRouter } from './Router';
export function App() {
    const [repo, setRepo] = useState(null);
    const [fallo, setFallo] = useState(null);
    useEffect(() => { crearRepositorio().then(setRepo, (e) => setFallo(e.message)); }, []);
    if (fallo)
        return _jsx("div", { className: "envoltura pagina", children: _jsxs("p", { className: "error", children: ["No se pudo conectar con los datos: ", fallo] }) });
    if (!repo)
        return _jsx("div", { className: "arranque", "aria-busy": "true" });
    return (_jsx(DataProvider, { repo: repo, children: _jsx(AuthProvider, { children: _jsx(ToastProvider, { children: _jsx(AppRouter, {}) }) }) }));
}
