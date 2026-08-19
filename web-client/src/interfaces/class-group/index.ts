import type { Assignment } from '../assignment';
import type { Course } from '../course';
import type { Shift } from '../shift';

export interface ClassGroup {
  id: number;
  name: string;
  semester: string;
  module: string;
  student_count: number;
  shift_id: number;
  course_id: number;
  shift: Shift;
  course: Course;
  assignments?: Assignment[];
}
