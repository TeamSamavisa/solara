import type { BaseQuery } from '../base-query';

export interface CourseQuery extends BaseQuery {
  name?: string;
  course_type_id?: number;
}
