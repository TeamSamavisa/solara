import type { BaseQuery } from '../base-query';

export interface SubjectQuery extends BaseQuery {
  name?: string;
  required_space_type_id?: number;
  course_id?: number;
}
