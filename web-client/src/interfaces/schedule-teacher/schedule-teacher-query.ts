import type { BaseQuery } from '../base-query';

export interface ScheduleTeacherQuery extends BaseQuery {
  schedule_id?: number;
  teacher_id?: number;
}
