import type { Course } from '../course';

export interface CourseType {
  id: number;
  name: string;
  courses?: Course[];
}
