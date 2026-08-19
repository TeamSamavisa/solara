import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AllConfigType } from 'src/config/config.type';
import { OrNeverType } from 'src/utils/types/or-never-type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService<AllConfigType>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('auth.secret', { infer: true }),
    });
  }

  public validate(payload: {
    id?: number;
    [key: string]: unknown;
  }): OrNeverType<{ id: number; [key: string]: unknown }> {
    if (!payload.id) {
      throw new UnauthorizedException();
    }

    return payload as { id: number; [key: string]: unknown };
  }
}
