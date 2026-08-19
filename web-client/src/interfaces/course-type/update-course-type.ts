import type { CreateCourseType } from './create-course-type';

export interface UpdateCourseType extends Partial<CreateCourseType> {
  id: number;
}
