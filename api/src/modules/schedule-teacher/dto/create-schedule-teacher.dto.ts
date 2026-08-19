import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateScheduleTeacherDto {
  @ApiProperty()
  @IsInt()
  @IsPositive({ message: 'Schedule ID must be a positive integer' })
  schedule_id: number;

  @ApiProperty()
  @IsInt()
  @IsPositive({ message: 'Teacher ID must be a positive integer' })
  teacher_id: number;
}
