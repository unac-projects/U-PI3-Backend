import { Controller, Get, Post, Patch, Body, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ReservasEspaciosService } from './reservas-espacios.service.js';
import { CreateReservaDto } from './dto/create-reserva.dto.js';

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

  @Post()
  crearReserva(@Body() createReservaDto: CreateReservaDto) {
    return this.reservasEspaciosService.crearReserva(createReservaDto);
  }

  // RF-04: Cancelación de reserva (requiere al menos 5 horas de anticipación)
  @Patch(':id/cancelar')
  cancelarReserva(
    @Param('id') reservaId: string,
    @Body('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.reservasEspaciosService.cancelarReserva(reservaId, usuarioId);
  }
}