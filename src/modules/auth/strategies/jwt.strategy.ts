import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secreto_fallback',
    });
  }

  async validate(payload: any) {
    if (payload.estado === 'SANCIONADO') {
      throw new UnauthorizedException('El usuario se encuentra sancionado.');
    }

    // Mapeamos 'sub' a 'id' para usarlo de forma muy cómoda como req.user.id
    return {
      id: payload.sub,
      correo: payload.correo,
      rol: payload.rol,
      estado: payload.estado,
    };
  }
}