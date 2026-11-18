/** Descarga un texto como archivo desde el navegador, sin pasar por ningún servidor. */
export function descargar(nombre, contenido, tipo = 'text/csv;charset=utf-8') {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
    const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
