import type { CreateScheduleTeacher } from './create-schedule-teacher';

export interface UpdateScheduleTeacher extends Partial<CreateScheduleTeacher> {
  id: number;
}
