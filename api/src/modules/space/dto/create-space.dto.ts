import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  IsInt,
  IsPositive,
  IsBoolean,
} from 'class-validator';

export class CreateSpaceDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Space name is required' })
  name: string;

  @ApiProperty()
  @IsInt({ message: 'Floor must be an integer' })
  floor: number;

  @ApiProperty()
  @IsInt()
  @IsPositive({ message: 'Capacity must be a positive integer' })
  capacity: number;

  @ApiProperty()
  @IsBoolean()
  blocked: boolean;

  @ApiProperty()
  @IsInt()
  @IsPositive({ message: 'Space type ID must be a positive integer' })
  space_type_id: number;
}
