import type { BaseQuery } from '../base-query';

export interface ClassGroupQuery extends BaseQuery {
  name?: string;
  semester?: string;
  module?: string;
  student_count?: number;
  shift_id?: number;
  course_id?: number;
}
