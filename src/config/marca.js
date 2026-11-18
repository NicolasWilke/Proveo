// Identidad de Unísono en un solo lugar. Para cambiar el nombre visible alcanza con `nombre`; los mails del servidor lo repiten en src/domain/notificaciones.ts y alertas.ts.
// logo.png es el isotipo (las dos líneas que se unen) y wordmark.png el nombre con su tipografía, ambos con fondo transparente.
// Salen del logo que mandó Nico (JPEG 3840×2160); cuando llegue el vectorial, guardarlos como .svg y cambiar las importaciones.
// Cuando llegue el vectorial, guardarlos como .svg y cambiar las importaciones; nada más depende de los archivos.
import logo from '@/assets/logo.png';
import wordmark from '@/assets/wordmark.png';
export const MARCA = {
    nombre: 'Unísono',
    lema: 'Conectando empresas. Generando negocios.',
    /** El lema en dos renglones, como va debajo del nombre en la cabecera. */
    lemaRenglones: ['Conectando empresas.', 'Generando negocios.'],
    /** Quién opera Unísono y adónde escribir. Se muestran en Términos, Privacidad y el pie; null = todavía sin definir. */
    operador: 'Nicolás Wilke',
    // ayuda@proveo.com.ar nunca se registró y ya no corresponde al nombre: queda sin mail hasta tener dominio propio.
    contacto: null,
    logo,
    wordmark,
    // Paleta de la hoja de marca. Texto azul sobre blanco usa `azulTexto` (contraste AA).
    colores: { marino: '#0B2D5B', azul: '#1E88E5', azulTexto: '#1565C0', verde: '#00C853', verdeTexto: '#00873A', claro: '#E8EEF5' },
};
