import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class AuthLoginDto {
  @ApiProperty({ example: 'test1@example.com', type: String })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;
}
