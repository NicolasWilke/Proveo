/**
 * Medición básica con Google Analytics 4. Solo se activa si el sitio tiene VITE_GA_ID (por ejemplo G-ABC123)
 * en Netlify, así la demo y el desarrollo no miden nada.
 *
 * Qué se mide: páginas vistas (sin los parámetros de la URL), el embudo registro → primer pedido →
 * primera oferta → pedido de plan, y los errores de la app. Nunca se manda mail, nombre, CUIT ni empresa.
 */
type Valor = string | number | boolean;
type Gtag = (...args: unknown[]) => void;
declare global { interface Window { dataLayer?: unknown[]; gtag?: Gtag } }

const ID = import.meta.env.VITE_GA_ID?.trim();
let listo = false;

export function prepararMedicion() {
  if (!ID || listo || typeof window === 'undefined') return;
  listo = true;
  window.dataLayer = window.dataLayer ?? [];
  // gtag necesita recibir el objeto arguments tal cual, no un array.
  // eslint-disable-next-line prefer-rest-params
  window.gtag = function gtag() { window.dataLayer!.push(arguments); };
  window.gtag('js', new Date());
  // Las páginas las manda vistaDePagina en cada cambio de ruta: la app no recarga.
  window.gtag('config', ID, { send_page_view: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ID)}`;
  document.head.appendChild(s);

  window.addEventListener('error', (e) => error(e.message || 'error'));
  window.addEventListener('unhandledrejection', (e) => error(String((e.reason as Error | undefined)?.message ?? e.reason ?? 'promesa rechazada')));
}

export function evento(nombre: string, datos: Record<string, Valor> = {}) {
  if (!listo) return;
  window.gtag?.('event', nombre, datos);
}

/** Solo la ruta: los ids de pedidos y perfiles se agrupan para no mandar datos de nadie. */
export function vistaDePagina(ruta: string) {
  const limpia = ruta.replace(/\/(red|cotizaciones)\/(?!nuevo$)[^/]+/, '/$1/:id');
  evento('page_view', { page_path: limpia, page_location: `${location.origin}${limpia}`, page_title: document.title });
}

function error(descripcion: string) {
  evento('exception', { description: descripcion.slice(0, 150), fatal: false });
}
