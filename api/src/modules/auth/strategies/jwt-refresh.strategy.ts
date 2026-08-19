import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtPayloadType } from './types/jwt-payload.type';
import { AllConfigType } from 'src/config/config.type';
import { OrNeverType } from 'src/utils/types/or-never-type';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService<AllConfigType>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('auth.refreshSecret', {
        infer: true,
      }),
    });
  }

  public validate(payload: JwtPayloadType): OrNeverType<JwtPayloadType> {
    if (!payload?.id || !payload?.role) {
      throw new UnauthorizedException();
    }

    return payload;
  }
}
