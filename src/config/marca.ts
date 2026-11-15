// Identidad de Pliego en un solo lugar. Para cambiar el nombre visible alcanza con `nombre`; los mails del servidor lo repiten en src/domain/notificaciones.ts y alertas.ts.
// logo.png es el símbolo (la P, sirve igual para Pliego). wordmark.png todavía dice "Proveo": no se usa;
// la cabecera y el pie escriben `nombre` en texto hasta que haya un wordmark nuevo.
// Cuando llegue el vectorial, guardarlos como .svg y cambiar las importaciones; nada más depende de los archivos.
import logo from '@/assets/logo.png';
import wordmark from '@/assets/wordmark.png';

export const MARCA = {
  nombre: 'Pliego',
  lema: 'Conectando empresas. Generando negocios.',
  /** El lema en dos renglones, como va debajo del nombre en la cabecera. */
  lemaRenglones: ['Conectando empresas.', 'Generando negocios.'],
  /** Quién opera Pliego y adónde escribir. Se muestran en Términos, Privacidad y el pie; null = todavía sin definir. */
  operador: 'Nicolás Wilke' as string | null,
  // ayuda@proveo.com.ar nunca se registró y ya no corresponde al nombre: queda sin mail hasta tener dominio propio.
  contacto: null as string | null,
  logo,
  wordmark,
  // Paleta de la hoja de marca. Texto azul sobre blanco usa `azulTexto` (contraste AA).
  colores: { marino: '#0B2D5B', azul: '#1E88E5', azulTexto: '#1565C0', verde: '#00C853', verdeTexto: '#00873A', claro: '#E8EEF5' },
} as const;
