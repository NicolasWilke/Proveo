export function esMailCorporativo(email, region) {
    const dominio = email.trim().toLowerCase().split('@')[1];
    if (!dominio || !dominio.includes('.'))
        return false;
    return !region.dominiosPersonales.includes(dominio);
}
export const esMailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
