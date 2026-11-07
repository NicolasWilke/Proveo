import type { Region, RegionId, Rubro, RubroId } from './types';

/** Grupos en el orden en que se muestran en los desplegables. */
export const GRUPOS_RUBRO = [
  'Servicios generales',
  'Mantenimiento e instalaciones',
  'Logística y transporte',
  'Insumos y materiales',
  'Personas y salud laboral',
  'Tecnología',
  'Servicios profesionales',
] as const;
export type GrupoRubro = (typeof GRUPOS_RUBRO)[number];

/**
 * Rubros de compra B2B. Cada id nuevo también tiene que estar en `rubroValido` de firebase/firestore.rules
 * (lo controla catalogos.test.ts) y, después de cambiarlo, hay que volver a publicar las reglas.
 * La unidad es la que se propone por defecto en los ítems del pedido.
 */
export const RUBROS: Rubro[] = [
  // Servicios generales
  { id: 'limpieza', nombre: 'Limpieza', unidad: 'horas operario', grupo: 'Servicios generales' },
  { id: 'seguridad', nombre: 'Seguridad privada', unidad: 'horas vigilador', grupo: 'Servicios generales' },
  { id: 'catering', nombre: 'Catering y comedor de planta', unidad: 'raciones', grupo: 'Servicios generales' },
  { id: 'cafeteria', nombre: 'Agua, cafetería y vending', unidad: 'equipos/mes', grupo: 'Servicios generales' },
  { id: 'plagas', nombre: 'Control de plagas', unidad: 'servicios', grupo: 'Servicios generales' },
  { id: 'residuos', nombre: 'Residuos y reciclado', unidad: 'toneladas', grupo: 'Servicios generales' },
  { id: 'eventos', nombre: 'Eventos y viajes corporativos', unidad: 'eventos', grupo: 'Servicios generales' },
  // Mantenimiento e instalaciones
  { id: 'mantenimiento', nombre: 'Mantenimiento industrial', unidad: 'horas técnico', grupo: 'Mantenimiento e instalaciones' },
  { id: 'electricidad', nombre: 'Instalaciones eléctricas', unidad: 'horas técnico', grupo: 'Mantenimiento e instalaciones' },
  { id: 'climatizacion', nombre: 'Climatización y refrigeración', unidad: 'equipos', grupo: 'Mantenimiento e instalaciones' },
  { id: 'incendio', nombre: 'Protección contra incendios', unidad: 'equipos', grupo: 'Mantenimiento e instalaciones' },
  { id: 'obras', nombre: 'Obras civiles y refacciones', unidad: 'm²', grupo: 'Mantenimiento e instalaciones' },
  { id: 'alquiler', nombre: 'Alquiler de equipos y autoelevadores', unidad: 'equipos/mes', grupo: 'Mantenimiento e instalaciones' },
  // Logística y transporte
  { id: 'cargas', nombre: 'Transporte de cargas', unidad: 'km', grupo: 'Logística y transporte' },
  { id: 'frio', nombre: 'Logística refrigerada', unidad: 'posiciones pallet/mes', grupo: 'Logística y transporte' },
  { id: 'deposito', nombre: 'Depósito y almacenaje', unidad: 'posiciones pallet/mes', grupo: 'Logística y transporte' },
  { id: 'mensajeria', nombre: 'Mensajería y courier', unidad: 'envíos', grupo: 'Logística y transporte' },
  { id: 'traslados', nombre: 'Transporte de personal', unidad: 'viajes', grupo: 'Logística y transporte' },
  // Insumos y materiales
  { id: 'packaging', nombre: 'Packaging flexible', unidad: 'kg', grupo: 'Insumos y materiales' },
  { id: 'embalaje', nombre: 'Cajas, pallets y embalaje', unidad: 'unidades', grupo: 'Insumos y materiales' },
  { id: 'etiquetas', nombre: 'Etiquetas e impresión', unidad: 'millares', grupo: 'Insumos y materiales' },
  { id: 'quimicos', nombre: 'Insumos químicos', unidad: 'litros', grupo: 'Insumos y materiales' },
  { id: 'epp', nombre: 'Ropa de trabajo y EPP', unidad: 'unidades', grupo: 'Insumos y materiales' },
  { id: 'oficina', nombre: 'Librería e insumos de oficina', unidad: 'unidades', grupo: 'Insumos y materiales' },
  { id: 'ferreteria', nombre: 'Ferretería y repuestos industriales', unidad: 'unidades', grupo: 'Insumos y materiales' },
  { id: 'combustibles', nombre: 'Combustibles y lubricantes', unidad: 'litros', grupo: 'Insumos y materiales' },
  { id: 'mobiliario', nombre: 'Mobiliario y equipamiento de oficina', unidad: 'unidades', grupo: 'Insumos y materiales' },
  // Personas y salud laboral
  { id: 'higiene', nombre: 'Higiene y seguridad laboral', unidad: 'horas profesional', grupo: 'Personas y salud laboral' },
  { id: 'medicina', nombre: 'Medicina laboral', unidad: 'exámenes', grupo: 'Personas y salud laboral' },
  { id: 'personal', nombre: 'Personal eventual y selección', unidad: 'horas operario', grupo: 'Personas y salud laboral' },
  { id: 'capacitacion', nombre: 'Capacitación', unidad: 'horas', grupo: 'Personas y salud laboral' },
  // Tecnología
  { id: 'it', nombre: 'Soporte IT y equipos', unidad: 'horas técnico', grupo: 'Tecnología' },
  { id: 'software', nombre: 'Software y licencias', unidad: 'licencias/mes', grupo: 'Tecnología' },
  { id: 'telecom', nombre: 'Telefonía e internet', unidad: 'líneas/mes', grupo: 'Tecnología' },
  // Servicios profesionales
  { id: 'contable', nombre: 'Servicios contables y legales', unidad: 'horas profesional', grupo: 'Servicios profesionales' },
  { id: 'seguros', nombre: 'Seguros', unidad: 'pólizas', grupo: 'Servicios profesionales' },
  { id: 'marketing', nombre: 'Marketing y publicidad', unidad: 'proyectos', grupo: 'Servicios profesionales' },
];

/** Rubros agrupados para los desplegables (`<optgroup>`), en el orden de GRUPOS_RUBRO. */
export const RUBROS_POR_GRUPO = GRUPOS_RUBRO.map((grupo) => ({ grupo, rubros: RUBROS.filter((r) => r.grupo === grupo) }));

export const REGIONES: Region[] = [
  { id: 'ros', nombre: 'Rosario y Gran Rosario' },
  { id: 'amba', nombre: 'AMBA' },
  { id: 'cba', nombre: 'Córdoba' },
  { id: 'noa', nombre: 'NOA' },
  { id: 'costa', nombre: 'Costa Atlántica' },
];

export const rubro = (id: RubroId) => RUBROS.find((r) => r.id === id)!;
export const region = (id: RegionId) => REGIONES.find((r) => r.id === id)!;

export const CONDICIONES_PAGO = ['Contado', '30 días fecha factura', '60 días fecha factura', '90 días fecha factura'];
