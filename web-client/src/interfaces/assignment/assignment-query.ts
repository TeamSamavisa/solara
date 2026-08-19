import type { BaseQuery } from '../base-query';

export interface AssignmentQuery extends BaseQuery {
  schedule_id?: number;
  teacher_id?: number;
  subject_id?: number;
  space_id?: number;
  class_group_id?: number;
}
