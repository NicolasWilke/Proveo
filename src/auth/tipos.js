export class FalloAuth extends Error {
    constructor(codigo) {
        super(codigo);
        this.codigo = codigo;
    }
}
export const MENSAJES_FALLO = {
    'mail-en-uso': 'Ya hay una cuenta con ese mail. Iniciá sesión o recuperá tu contraseña.',
    credenciales: 'El mail o la contraseña no coinciden.',
    'password-debil': 'La contraseña es muy corta.',
    'demasiados-intentos': 'Demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.',
    red: 'No hay conexión. Revisá internet y probá de nuevo.',
    'sin-permiso': 'No tenés permiso para hacer eso.',
    'sin-equipo': 'Tu empresa ya no tiene el plan Empresa, así que el equipo quedó en pausa. Pedile al titular que lo renueve.',
    'sin-perfil': 'Tu usuario no tiene una empresa asociada. Si eras parte de un equipo, pedile al titular que te vuelva a invitar.',
    'invitacion-invalida': 'Este enlace ya se usó, venció o el equipo está completo. Pedile uno nuevo a quien te invitó.',
    desconocido: 'Algo falló. Probá de nuevo en un momento.',
};
