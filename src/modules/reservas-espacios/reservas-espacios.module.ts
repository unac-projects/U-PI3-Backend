import { Module } from '@nestjs/common';
import { ReservasEspaciosService } from './reservas-espacios.service.js';
import { ReservasEspaciosController } from './reservas-espacios.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReservasEspaciosController],
  providers: [ReservasEspaciosService],
})
export class ReservasEspaciosModule {}