import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ImplementosService } from './implementos.service.js';
import {
  CreateImplementoDto,
  SolicitarPrestamoDto,
  EntregarQrDto,
} from './dto/create-implemento.dto.js';

@Controller('implementos')
export class ImplementosController {
  constructor(private readonly implementosService: ImplementosService) {}

  // C - CREAR
  @Post()
  crear(@Body() dto: CreateImplementoDto) {
    return this.implementosService.crearImplemento(dto);
  }

  // R - LEER TODOS
  @Get()
  obtenerTodos() {
    return this.implementosService.obtenerInventario();
  }

  // R - LEER UNO
  @Get(':id')
  obtenerUno(@Param('id', ParseIntPipe) id: number) {
    return this.implementosService.obtenerPorId(id);
  }

  // U - ACTUALIZAR
  @Put(':id')
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateImplementoDto>,
  ) {
    return this.implementosService.actualizarImplemento(id, dto);
  }

  // D - ELIMINAR
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.implementosService.eliminarImplemento(id);
  }

  // ACCIONES DE PRÉSTAMO Y QR
  @Post('solicitar')
  solicitar(@Body() dto: SolicitarPrestamoDto) {
    return this.implementosService.solicitarPrestamo(dto);
  }

  @Post('entregar-qr')
  entregarPorQr(@Body() dto: EntregarQrDto) {
    return this.implementosService.entregarPorQr(dto.tokenQr);
  }

  // Obtener préstamos activos del usuario
  @Get('mis-prestamos/:usuarioId')
  obtenerMisPrestamos(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.implementosService.obtenerPrestamosActivosUsuario(usuarioId);
  }

  // RF-11: Devolución vía Token QR
  @Post('devolver-qr')
  devolverPorQr(@Body() dto: EntregarQrDto) {
    return this.implementosService.devolverPorQr(dto.tokenQr);
  }
}
