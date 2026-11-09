import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { AgendamientoService } from './agendamiento.service';
import { CrearCitaDto } from './dto/crear-cita.dto';
import { GestionDisponibilidadDto } from './dto/gestion-disponibilidad.dto';
import { CategoriaServicio } from '@prisma/client';

@Controller('agendamientos')
export class AgendamientoController {
  constructor(private readonly agendamientoService: AgendamientoService) {}

  // RF-05: Visualización de profesionales y disponibilidad
  @Get('profesionales')
  obtenerProfesionales(@Query('servicio') servicio?: CategoriaServicio) {
    return this.agendamientoService.obtenerProfesionalesYDisponibilidad(servicio);
  }

  // RF-06: Confirmar y registrar cita
  @Post()
  crearCita(@Body() dto: CrearCitaDto) {
    return this.agendamientoService.crearCita(dto);
  }

  // RF-07: Gestionar disponibilidad del profesional
  @Post('disponibilidad')
  gestionarDisponibilidad(@Body() dto: GestionDisponibilidadDto) {
    return this.agendamientoService.gestionarDisponibilidad(dto);
  }

  // RF-08: Historial de citas clasificado por estudiante
  @Get('historial/:estudianteId')
  obtenerHistorial(@Param('estudianteId', ParseIntPipe) estudianteId: number) {
    return this.agendamientoService.obtenerHistorialEstudiante(estudianteId);
  }
}