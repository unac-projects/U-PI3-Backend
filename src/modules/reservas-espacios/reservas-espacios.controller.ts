import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { ReservasEspaciosService } from './reservas-espacios.service.js';
import { CreateReservaDto } from './dto/create-reserva.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('reservas-espacios')
export class ReservasEspaciosController {
  constructor(private readonly reservasEspaciosService: ReservasEspaciosService) {}

  @Get('disponibilidad')
  obtenerDisponibilidad(
    @Query('espacioId') espacioId: string,
    @Query('fecha') fecha: string, // Formato esperado: YYYY-MM-DD
  ) {
    return this.reservasEspaciosService.obtenerDisponibilidad(espacioId, fecha);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  crearReserva(@Req() req: any, @Body() createReservaDto: CreateReservaDto) {
    const usuarioId = req.user.id; // Extraído limpiamente del token JWT
    return this.reservasEspaciosService.crearReserva(usuarioId, createReservaDto);
  }

  // RF-04: Cancelación de reserva (requiere al menos 5 horas de anticipación)
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancelar')
  cancelarReserva(
    @Param('id') reservaId: string,
    @Req() req: any,
  ) {
    const usuarioId = req.user.id;
    return this.reservasEspaciosService.cancelarReserva(reservaId, usuarioId);
  }
}