import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, IsInt } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Weekday is required' })
  weekday: string;

  @ApiProperty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format',
  })
  start_time: string;

  @ApiProperty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:MM format',
  })
  end_time: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty({ message: 'Shift ID is required' })
  shift_id: number;
}
