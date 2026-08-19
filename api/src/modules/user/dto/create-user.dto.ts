import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  IsEmail,
  Matches,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Full name is required' })
  full_name: string;

  @ApiProperty()
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^\d+$/, { message: 'Registration must be a numeric string' })
  registration?: string;

  @ApiPropertyOptional({
    enum: ['admin', 'principal', 'coordinator', 'teacher'],
    default: 'teacher',
  })
  @IsOptional()
  @IsString()
  @IsIn(['admin', 'principal', 'coordinator', 'teacher'], {
    message: 'Role must be one of: admin, principal, coordinator, teacher',
  })
  role?: string;
}
