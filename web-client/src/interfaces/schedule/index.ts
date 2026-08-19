import type { Assignment } from '../assignment';
import type { ScheduleTeacher } from '../schedule-teacher';
import type { Shift } from '../shift';

export interface Schedule {
  id: number;
  weekday: string;
  start_time: string;
  end_time: string;
  shift_id: number;
  shift?: Shift;
  scheduleTeachers?: ScheduleTeacher[];
  assignments?: Assignment[];
}
