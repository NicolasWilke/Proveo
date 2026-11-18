import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
const RepoContext = createContext(null);
export function DataProvider({ repo, children }) {
    return _jsx(RepoContext.Provider, { value: repo, children: children });
}
export function useRepo() {
    const r = useContext(RepoContext);
    if (!r)
        throw new Error('useRepo fuera de DataProvider');
    return r;
}
/**
 * Lectura de datos con refresco automático cuando el repositorio avisa cambios.
 * Mantiene el último dato mientras recarga, para que la vista no parpadee.
 * Reemplazable por TanStack Query sin tocar las pantallas.
 */
export function useQuery(leer, deps) {
    const repo = useRepo();
    const [data, setData] = useState(undefined);
    const [error, setError] = useState(null);
    const leerRef = useRef(leer);
    leerRef.current = leer;
    const cargar = useCallback(() => {
        let vigente = true;
        leerRef.current(repo).then((d) => vigente && setData(d), (e) => vigente && setError(e));
        return () => { vigente = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repo, ...deps]);
    useEffect(() => {
        let cancelar = cargar();
        const desuscribir = repo.suscribir(() => { cancelar(); cancelar = cargar(); });
        return () => { cancelar(); desuscribir(); };
    }, [cargar, repo]);
    return { data, error, cargando: data === undefined && !error };
}
