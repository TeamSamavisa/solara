import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsOptional,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAssignmentDto {
  @ApiPropertyOptional({
    type: [Number],
    description: 'Array of schedule IDs',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, {
    message:
      'At least one schedule must be provided if schedules are specified',
  })
  @IsInt({ each: true })
  @IsPositive({
    each: true,
    message: 'Each schedule ID must be a positive integer',
  })
  @Type(() => Number)
  schedule_ids?: number[];

  @ApiProperty()
  @IsInt()
  @IsPositive({ message: 'Teacher ID must be a positive integer' })
  teacher_id: number;

  @ApiProperty()
  @IsInt()
  @IsPositive({ message: 'Subject ID must be a positive integer' })
  subject_id: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive({ message: 'Space ID must be a positive integer' })
  space_id?: number;

  @ApiProperty()
  @IsInt()
  @IsPositive({ message: 'Class group ID must be a positive integer' })
  class_group_id: number;

  @ApiPropertyOptional({ default: 2 })
  @IsOptional()
  @IsInt()
  @IsPositive({ message: 'Duration must be a positive integer' })
  duration?: number;
}
