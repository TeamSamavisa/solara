import type { ClassGroup } from '../class-group';
import type { Schedule } from '../schedule';
import type { Space } from '../space';
import type { Subject } from '../subject';
import type { User } from '../user';

export interface Assignment {
  id: number;
  teacher_id: number;
  subject_id: number;
  space_id: number | null;
  class_group_id: number;
  duration?: number;
  schedules?: Schedule[];
  teacher?: User;
  subject?: Subject;
  space?: Space;
  classGroup?: ClassGroup;
  violates_availability?: number | boolean;
  createdAt?: string;
  updatedAt?: string;
  // flatten fields from backend
  'teacher.id'?: number;
  'teacher.full_name'?: string;
  'teacher.email'?: string;
  'subject.id'?: number;
  'subject.name'?: string;
  'schedule.id'?: number;
  'schedule.weekday'?: string;
  'schedule.start_time'?: string;
  'schedule.end_time'?: string;
  'space.id'?: number;
  'space.name'?: string;
  'space.capacity'?: number;
  'classGroup.id'?: number;
  'classGroup.name'?: string;
  'classGroup.course.id'?: number;
  'classGroup.course.name'?: string;
  'classGroup.shift.id'?: number;
  'classGroup.shift.name'?: string;
}

export interface CreateAssignment {
  schedule_ids?: number[];
  teacher_id: number;
  subject_id: number;
  space_id?: number | null;
  class_group_id: number;
  duration?: number;
}

export interface UpdateAssignment extends Partial<CreateAssignment> {
  id: number;
}

export interface AssignmentQuery {
  page?: number;
  limit?: number;
  schedule_id?: number;
  teacher_id?: number;
  subject_id?: number;
  space_id?: number;
  class_group_id?: number;
}
