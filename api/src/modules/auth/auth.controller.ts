import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthLoginDto } from './dto/auth-login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { User } from '../user/entities/user.entity';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshAuthGuard } from './guards/refresh-jwt-auth.guard';
import { NullableType } from 'src/utils/types/nullable-type';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @SerializeOptions({
    groups: ['me'],
  })
  @Post('login')
  @ApiOkResponse({
    type: LoginResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  public login(@Body() loginDto: AuthLoginDto): Promise<LoginResponseDto> {
    return this.authService.validateLogin(loginDto);
  }

  @ApiBearerAuth()
  @SerializeOptions({
    groups: ['me'],
  })
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    type: User,
  })
  @HttpCode(HttpStatus.OK)
  public me(
    @Request() request: { user: JwtPayloadType },
  ): Promise<NullableType<Partial<User>>> {
    return this.authService.me(request.user);
  }

  @ApiBearerAuth()
  @ApiOkResponse({
    type: RefreshResponseDto,
  })
  @SerializeOptions({
    groups: ['me'],
  })
  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @HttpCode(HttpStatus.OK)
  public refresh(
    @Request() req: { user: { id: number; role: string } },
  ): Promise<RefreshResponseDto> {
    const payload = req.user;
    return this.authService.refreshToken(payload);
  }
}
