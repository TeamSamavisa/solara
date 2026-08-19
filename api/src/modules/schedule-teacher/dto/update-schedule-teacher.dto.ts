import { PartialType } from '@nestjs/swagger';
import { CreateScheduleTeacherDto } from './create-schedule-teacher.dto';

export class UpdateScheduleTeacherDto extends PartialType(
  CreateScheduleTeacherDto,
) {}
