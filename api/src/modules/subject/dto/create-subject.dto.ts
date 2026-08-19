import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsInt, IsPositive } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty()
  @IsString()
  @MinLength(1, { message: 'Subject name is required' })
  name: string;

  @ApiProperty()
  @IsInt()
  @IsPositive({ message: 'Required space type ID must be a positive integer' })
  required_space_type_id: number;

  @ApiProperty()
  @IsInt()
  @IsPositive({ message: 'Required course ID must be a positive integer' })
  course_id: number;
}
