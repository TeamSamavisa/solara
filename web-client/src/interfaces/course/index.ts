import type { ClassGroup } from '../class-group';
import type { CourseType } from '../course-type';
import type { Subject } from '../subject';

export interface Course {
  id: number;
  name: string;
  course_type_id: number;
  courseType: CourseType;
  classGroups?: ClassGroup[];
  subjects?: Subject[];
}
