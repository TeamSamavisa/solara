import type { Assignment } from '../assignment';
import type { ScheduleTeacher } from '../schedule-teacher';

export interface User {
  id: number;
  full_name: string;
  registration: string;
  email: string;
  role: string;
  password?: string;
  scheduleTeachers?: ScheduleTeacher[];
  assignments?: Assignment[];
}
