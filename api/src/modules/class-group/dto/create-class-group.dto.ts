import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsInt, IsPositive } from 'class-validator';

export class CreateClassGroupDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Class group name is required' })
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Semester is required' })
  semester: string;

  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Module is required' })
  module: string;

  @ApiProperty()
  @IsInt()
  @IsPositive({ message: 'Student count must be a positive integer' })
  student_count: number;

  @ApiProperty()
  @IsInt()
  @IsPositive({ message: 'Shift ID must be a positive integer' })
  shift_id: number;

  @ApiProperty()
  @IsInt()
  @IsPositive({ message: 'Course ID must be a positive integer' })
  course_id: number;
}
