import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EstadoPrestamo } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  CreateImplementoDto,
  SolicitarPrestamoDto,
} from './dto/create-implemento.dto.js';

@Injectable()
export class ImplementosService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. CREAR (Create)
  async crearImplemento(dto: CreateImplementoDto) {
    return this.prisma.implemento.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        stockTotal: dto.stockTotal,
        stockDisponible: dto.stockTotal, // Inicialmente igual al total
        categoria: dto.categoria,
      },
    });
  }

  // 2. LEER / OBTENER TODOS (Read)
  async obtenerInventario() {
    return this.prisma.implemento.findMany({
      orderBy: { id: 'desc' },
    });
  }

  // 2. LEER UNO POR ID (Read One)
  async obtenerPorId(id: number) {
    const implemento = await this.prisma.implemento.findUnique({
      where: { id },
    });
    if (!implemento) throw new NotFoundException('Implemento no encontrado.');
    return implemento;
  }

  // 3. ACTUALIZAR (Update)
  async actualizarImplemento(id: number, dto: Partial<CreateImplementoDto>) {
    await this.obtenerPorId(id); // Validar existencia

    return this.prisma.implemento.update({
      where: { id },
      data: {
        ...dto,
        // Si se actualiza el stockTotal, ajustamos el disponible proporcionalmente
        ...(dto.stockTotal !== undefined && {
          stockTotal: dto.stockTotal,
          stockDisponible: dto.stockTotal,
        }),
      },
    });
  }

  // 4. ELIMINAR (Delete)
  async eliminarImplemento(id: number) {
    await this.obtenerPorId(id);

    // Verificar si tiene préstamos activos antes de borrar
    const prestamosActivos = await this.prisma.prestamo.count({
      where: {
        implementoId: id,
        estado: { in: ['SOLICITADO', 'EN_PRESTAMO'] },
      },
    });

    if (prestamosActivos > 0) {
      throw new BadRequestException(
        'No se puede eliminar un implemento con préstamos activos.',
      );
    }

    return this.prisma.implemento.delete({ where: { id } });
  }

  // --- MÉTODOS DE PRÉSTAMO (RF-10, RF-11) ---
  async solicitarPrestamo(dto: SolicitarPrestamoDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
    });
    if (!usuario || usuario.estado === 'SANCIONADO') {
      throw new BadRequestException('Usuario no válido o sancionado.');
    }

    return this.prisma.$transaction(async (tx) => {
      const implemento = await tx.implemento.findUnique({
        where: { id: dto.implementoId },
      });
      if (!implemento || implemento.stockDisponible <= 0) {
        throw new BadRequestException('Sin existencias disponibles.');
      }

      await tx.implemento.update({
        where: { id: dto.implementoId },
        data: { stockDisponible: implemento.stockDisponible - 1 },
      });

      return tx.prestamo.create({
        data: {
          usuarioId: dto.usuarioId,
          implementoId: dto.implementoId,
          tokenQr: `PRESTAMO-${randomUUID()}`,
          estado: EstadoPrestamo.SOLICITADO,
        },
        include: { implemento: true },
      });
    });
  }

  async entregarPorQr(tokenQr: string) {
    const prestamo = await this.prisma.prestamo.findUnique({
      where: { tokenQr },
    });
    if (!prestamo || prestamo.estado !== EstadoPrestamo.SOLICITADO) {
      throw new BadRequestException('Código QR inválido o ya entregado.');
    }

    const fechaLimite = new Date();
    fechaLimite.setHours(fechaLimite.getHours() + 2);

    return this.prisma.prestamo.update({
      where: { id: prestamo.id },
      data: {
        estado: EstadoPrestamo.EN_PRESTAMO,
        fechaEntrega: new Date(),
        fechaLimite,
      },
    });
  }

  // Obtener préstamos activos de un estudiante
  async obtenerPrestamosActivosUsuario(usuarioId: number) {
    return this.prisma.prestamo.findMany({
      where: {
        usuarioId,
        estado: { in: ['SOLICITADO', 'EN_PRESTAMO'] },
      },
      include: { implemento: true },
      orderBy: { id: 'desc' },
    });
  }

  // RF-11: Registrar devolución recibiendo directamente el Token QR que escanea el encargado
  async devolverPorQr(tokenQr: string) {
    const prestamo = await this.prisma.prestamo.findUnique({
      where: { tokenQr },
      include: { implemento: true },
    });

    if (!prestamo) {
      throw new NotFoundException(
        'No se encontró ningún préstamo con ese código QR.',
      );
    }

    if (prestamo.estado === 'DEVUELTO') {
      throw new BadRequestException(
        'Este préstamo ya fue devuelto anteriormente.',
      );
    }

    // Transacción atómica: Cambiar estado a DEVUELTO y reponer +1 al stock
    return this.prisma.$transaction(async (tx) => {
      await tx.implemento.update({
        where: { id: prestamo.implementoId },
        data: { stockDisponible: prestamo.implemento.stockDisponible + 1 },
      });

      return tx.prestamo.update({
        where: { id: prestamo.id },
        data: {
          estado: EstadoPrestamo.DEVUELTO,
          fechaDevolucion: new Date(),
        },
      });
    });
  }
}
