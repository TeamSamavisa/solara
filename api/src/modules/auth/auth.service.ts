import {
  HttpStatus,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import ms from 'ms';
import { ConfigService } from '@nestjs/config';
import { AuthLoginDto } from './dto/auth-login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserService } from '../user/user.service';
import { AllConfigType } from 'src/config/config.type';
import { User } from '../user/entities/user.entity';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UserService,
    private configService: ConfigService<AllConfigType>,
  ) {}

  async validateLogin(loginDto: AuthLoginDto): Promise<LoginResponseDto> {
    const user = await this.usersService.getByEmail(loginDto.email);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'invalidCredentials',
        },
      });
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );

    if (!isValidPassword) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'invalidCredentials',
        },
      });
    }

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: user.id,
      role: user.role,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...authenticatedUser } = user;

    return {
      refreshToken,
      token,
      tokenExpires,
      user: authenticatedUser,
    };
  }

  async me(userJwtPayload: JwtPayloadType): Promise<Partial<User>> {
    return this.usersService.getById(userJwtPayload.id);
  }

  async refreshToken(payload: {
    id: number;
    role: string;
  }): Promise<Omit<LoginResponseDto, 'user'>> {
    const user = await this.usersService.getById(payload.id);

    if (!user?.role) throw new UnauthorizedException();
    if (!user?.id) throw new UnauthorizedException();

    const {
      token,
      refreshToken: newRefreshToken,
      tokenExpires,
    } = await this.getTokensData({
      id: user.id,
      role: user.role,
    });

    return {
      token,
      refreshToken: newRefreshToken,
      tokenExpires,
    };
  }

  private async getTokensData(data: { id: User['id']; role: User['role'] }) {
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id: data.id,
          role: data.role,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        {
          id: data.id,
          role: data.role,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }
}
