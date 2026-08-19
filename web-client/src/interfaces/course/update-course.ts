import type { CreateCourse } from './create-course';

export interface UpdateCourse extends Partial<CreateCourse> {
  id: number;
}
