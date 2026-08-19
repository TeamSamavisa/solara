import type { Schedule } from '../schedule';
import type { User } from '../user';

export interface ScheduleTeacher {
  id: number;
  schedule_id: number;
  teacher_id: number;
  schedule: Schedule;
  teacher: User;
}
