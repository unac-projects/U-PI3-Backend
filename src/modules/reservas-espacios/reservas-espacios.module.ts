import { Module } from '@nestjs/common';
import { ReservasEspaciosService } from './reservas-espacios.service.js';
import { ReservasEspaciosController } from './reservas-espacios.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ReservasEspaciosController],
  providers: [ReservasEspaciosService],
})
export class ReservasEspaciosModule {}