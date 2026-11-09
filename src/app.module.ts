import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module.js';
import { ImplementosModule } from './modules/implementos/implementos.module.js';
import { ReservasEspaciosModule } from './modules/reservas-espacios/reservas-espacios.module.js';
import { AgendamientoModule } from './modules/agendamiento/agendamiento.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que las variables estén disponibles en todo el proyecto
    }),
    PrismaModule,
    AuthModule,
    ImplementosModule,
    ReservasEspaciosModule,
    AgendamientoModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}