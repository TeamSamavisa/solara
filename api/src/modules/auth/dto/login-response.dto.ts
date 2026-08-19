import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from 'src/modules/user/dto/user-response.dto';

export class LoginResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  tokenExpires: number;

  @ApiProperty({ type: () => UserResponseDto })
  user: UserResponseDto;
}
