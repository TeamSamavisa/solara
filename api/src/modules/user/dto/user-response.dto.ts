import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  full_name: string;

  @ApiProperty()
  registration: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;
}
