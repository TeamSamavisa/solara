import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsInt, IsPositive } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Course name is required' })
  name: string;

  @ApiProperty()
  @IsInt()
  @IsPositive({ message: 'Course type ID must be a positive integer' })
  course_type_id: number;
}
