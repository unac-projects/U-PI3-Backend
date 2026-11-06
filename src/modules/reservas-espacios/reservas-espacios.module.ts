import { Module } from '@nestjs/common';
import { ReservasEspaciosController } from './reservas-espacios.controller.js';
import { ReservasEspaciosService } from './reservas-espacios.service.js';

@Module({
  controllers: [ReservasEspaciosController],
  providers: [ReservasEspaciosService]
})
export class ReservasEspaciosModule {}
