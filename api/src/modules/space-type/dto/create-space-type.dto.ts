import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateSpaceTypeDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Space type name is required' })
  name: string;
}
