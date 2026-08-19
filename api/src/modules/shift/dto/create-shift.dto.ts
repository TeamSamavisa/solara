import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateShiftDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Shift name is required' })
  name: string;
}
