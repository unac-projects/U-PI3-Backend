import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secreto_fallback',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
            '1d') as any, // <-- Añadir 'as any' aquí
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule, JwtStrategy],
})
export class AuthModule {}
