export interface DatosCreacionReserva {
  usuarioId: number;
  espacioId: string;
  fechaInicio: Date;
  cantidadPersonas: number;
}

export class ReservaFactory {
  /**
   * Factory Method: Encapsula la instanciación y reglas por defecto de una Reserva.
   */
  static crearReserva(datos: DatosCreacionReserva) {
    const { usuarioId, espacioId, fechaInicio, cantidadPersonas } = datos;

    // Regla de negocio encapsulada en la fábrica: Duración exacta de 60 minutos (1 hora)
    const fechaFin = new Date(fechaInicio.getTime() + 60 * 60 * 1000);

    return {
      usuarioId,
      espacioId,
      fechaInicio,
      fechaFin,
      cantidadPersonas,
      estado: 'CONFIRMADA' as const,
    };
  }
}