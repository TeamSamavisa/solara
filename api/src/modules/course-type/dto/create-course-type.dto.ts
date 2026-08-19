import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCourseTypeDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Course type name is required' })
  name: string;
}
