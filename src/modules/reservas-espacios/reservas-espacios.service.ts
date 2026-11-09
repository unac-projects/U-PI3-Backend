import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateReservaDto } from './dto/create-reserva.dto.js';
import { ReservaFactory } from './factories/reserva.factory.js';

@Injectable()
export class ReservasEspaciosService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerDisponibilidad(espacioId: string, fechaStr: string) {
    // 1. Verificar si existe el espacio deportivo
    const espacio = await this.prisma.espacioDeportivo.findUnique({
      where: { id: espacioId },
    });

    if (!espacio) {
      throw new NotFoundException('El espacio deportivo solicitado no existe.');
    }

    // 2. Definir rango del día (00:00:00 a 23:59:59)
    const inicioDia = new Date(`${fechaStr}T00:00:00.000Z`);
    const finDia = new Date(`${fechaStr}T23:59:59.999Z`);

    // 3. Buscar reservas existentes activas en esa fecha
    const reservasOcupadas = await this.prisma.reserva.findMany({
      where: {
        espacioId,
        estado: { not: 'CANCELADA' },
        fechaInicio: { gte: inicioDia },
        fechaFin: { lte: finDia },
      },
    });

    // 4. Generar bloques operativos de 60 min (8 AM a 6 PM / 18:00)
    const bloquesDisponibilidad = [];
    const horaApertura = 8;
    const horaCierre = 18;

    for (let hora = horaApertura; hora < horaCierre; hora++) {
      const inicioBloque = new Date(
        `${fechaStr}T${hora.toString().padStart(2, '0')}:00:00.000Z`,
      );

      // Verificar si hay alguna reserva que se cruce con este bloque
      const estaOcupado = reservasOcupadas.some(
        (r: any) => r.fechaInicio.getTime() === inicioBloque.getTime(),
      );

      bloquesDisponibilidad.push({
        horaInicio: `${hora.toString().padStart(2, '0')}:00`,
        horaFin: `${(hora + 1).toString().padStart(2, '0')}:00`,
        estado: estaOcupado ? 'OCUPADO' : 'DISPONIBLE',
      });
    }

    return {
      espacio: espacio.nombre,
      minParticipantes: espacio.minParticipantes,
      fecha: fechaStr,
      bloques: bloquesDisponibilidad,
    };
  }

  async crearReserva(dto: CreateReservaDto) {
    const { usuarioId, espacioId, fechaInicio: fechaInicioStr, cantidadPersonas } = dto;

    // 1. Validar existencia de usuario y su estado activo
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    if (!usuario) {
      throw new NotFoundException('El usuario especificado no existe.');
    }
    if (usuario.estado === 'SANCIONADO') {
      throw new BadRequestException('El usuario se encuentra sancionado.');
    }

    // 2. Validar existencia del espacio deportivo
    const espacio = await this.prisma.espacioDeportivo.findUnique({
      where: { id: espacioId },
    });
    if (!espacio) {
      throw new NotFoundException('El espacio deportivo no existe.');
    }

    // 3. Validar número mínimo de participantes (RF-02)
    if (cantidadPersonas < espacio.minParticipantes) {
      throw new BadRequestException(
        `Este espacio requiere un mínimo de ${espacio.minParticipantes} participantes.`,
      );
    }

    const inicio = new Date(fechaInicioStr);

    // 4. USO DEL PATRÓN FACTORY METHOD: La fábrica construye los datos de la reserva con sus 60 min y estado
    const datosReserva = ReservaFactory.crearReserva({
      usuarioId,
      espacioId,
      fechaInicio: inicio,
      cantidadPersonas,
    });

    // 5. Verificar superposición en el mismo horario (RF-03)
    const conflictoEspacio = await this.prisma.reserva.findFirst({
      where: {
        espacioId,
        estado: { not: 'CANCELADA' },
        OR: [
          { fechaInicio: { lte: datosReserva.fechaInicio }, fechaFin: { gt: datosReserva.fechaInicio } },
          { fechaInicio: { lt: datosReserva.fechaFin }, fechaFin: { gte: datosReserva.fechaFin } },
        ],
      },
    });

    if (conflictoEspacio) {
      throw new BadRequestException('El espacio ya se encuentra reservado en ese horario.');
    }

    // 6. Verificar acaparamiento (RF-03): Sin reservas activas en la fecha + delay de 1 hora
    const inicioDia = new Date(inicio);
    inicioDia.setUTCHours(0, 0, 0, 0);
    const finDia = new Date(inicio);
    finDia.setUTCHours(23, 59, 59, 999);

    const reservaPreviaEstudiante = await this.prisma.reserva.findFirst({
      where: {
        usuarioId,
        estado: { not: 'CANCELADA' },
        fechaInicio: { gte: inicioDia, lte: finDia },
      },
      orderBy: { fechaFin: 'desc' },
    });

    if (reservaPreviaEstudiante) {
      const finUltimaReserva = new Date(reservaPreviaEstudiante.fechaFin);
      const tiempoPermitido = new Date(finUltimaReserva.getTime() + 60 * 60 * 1000);

      if (inicio < tiempoPermitido) {
        throw new BadRequestException(
          'Debes esperar al menos 1 hora tras terminar tu reserva anterior para realizar una nueva.',
        );
      }
    }

    // 7. Insertar en base de datos usando el objeto creado por la fábrica
    return this.prisma.reserva.create({
      data: datosReserva,
      include: {
        espacio: true,
      },
    });
  }

  async cancelarReserva(reservaId: string, usuarioId: number) {
    // 1. Buscar la reserva
    const reserva = await this.prisma.reserva.findUnique({
      where: { id: reservaId },
    });

    if (!reserva) {
      throw new NotFoundException('La reserva especificada no existe.');
    }

    // 2. Verificar que pertenezca al usuario solicitante
    if (reserva.usuarioId !== usuarioId) {
      throw new BadRequestException('No tienes permiso para cancelar esta reserva.');
    }

    if (reserva.estado === 'CANCELADA') {
      throw new BadRequestException('La reserva ya se encuentra cancelada.');
    }

    // 3. Validar RF-04: Mínimo 5 horas de anticipación
    const ahora = new Date();
    const inicioReserva = new Date(reserva.fechaInicio);
    const diferenciaHoras = (inicioReserva.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (diferenciaHoras < 5) {
      throw new BadRequestException(
        'Las reservas solo pueden cancelarse con al menos 5 horas de anticipación.',
      );
    }

    // 4. Cambiar el estado a CANCELADA
    return this.prisma.reserva.update({
      where: { id: reservaId },
      data: { estado: 'CANCELADA' },
    });
  }
}