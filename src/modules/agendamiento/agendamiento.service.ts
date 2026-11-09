import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService} from '../../prisma/prisma.service';
import { CrearCitaDto } from './dto/crear-cita.dto';
import { GestionDisponibilidadDto } from './dto/gestion-disponibilidad.dto';
import { CategoriaServicio, EstadoCita } from '@prisma/client';

@Injectable()
export class AgendamientoService {
  constructor(private readonly prisma: PrismaService) {}

  // RF-05: Visualización de disponibilidad de profesionales
  async obtenerProfesionalesYDisponibilidad(servicio?: CategoriaServicio) {
    return this.prisma.usuario.findMany({
      where: {
        rol: 'PROFESIONAL_CAU',
      },
      select: {
        id: true,
        nombreCompleto: true,
        correo: true,
        disponibilidades: {
          where: { estado: 'DISPONIBLE' },
          orderBy: { fecha: 'asc' },
        },
      },
    });
  }

  // RF-06: Confirmar y registrar cita
  async crearCita(dto: CrearCitaDto) {
    const estudiante = await this.prisma.usuario.findUnique({ where: { id: dto.estudianteId } });
    if (!estudiante) throw new NotFoundException('Estudiante no encontrado');

    const profesional = await this.prisma.usuario.findUnique({ where: { id: dto.profesionalId } });
    if (!profesional) throw new NotFoundException('Profesional no encontrado');

    const citaExistente = await this.prisma.cita.findFirst({
      where: {
        profesionalId: dto.profesionalId,
        fechaHora: new Date(dto.fechaHora),
        estado: EstadoCita.PROGRAMADA,
      },
    });

    if (citaExistente) {
      throw new BadRequestException('El profesional ya cuenta con una cita en este horario.');
    }

    return this.prisma.cita.create({
      data: {
        estudianteId: dto.estudianteId,
        profesionalId: dto.profesionalId,
        servicio: dto.servicio,
        fechaHora: new Date(dto.fechaHora),
        motivo: dto.motivo,
        estado: EstadoCita.PROGRAMADA,
      },
    });
  }

  // RF-07: Gestionar disponibilidad del profesional
  async gestionarDisponibilidad(dto: GestionDisponibilidadDto) {
    return this.prisma.disponibilidadProfesional.create({
      data: {
        profesionalId: dto.profesionalId,
        fecha: new Date(dto.fecha),
        horaInicio: dto.horaInicio,
        horaFin: dto.horaFin,
        estado: dto.estado,
      },
    });
  }

  // RF-08: Historial de citas clasificado (Vigentes e Históricas)
  async obtenerHistorialEstudiante(estudianteId: number) {
    const citas = await this.prisma.cita.findMany({
      where: { estudianteId },
      include: { profesional: { select: { nombreCompleto: true } } },
      orderBy: { fechaHora: 'desc' },
    });

    const ahora = new Date();

    const vigentes = citas.filter(
      (c: any) => c.estado === EstadoCita.PROGRAMADA && new Date(c.fechaHora) >= ahora,
    );

    const historicas = citas.filter(
      (c: any) => c.estado !== EstadoCita.PROGRAMADA || new Date(c.fechaHora) < ahora,
    );

    return { vigentes, historicas };
  }
}