import type { BaseQuery } from '../base-query';

export interface ScheduleQuery extends BaseQuery {
  weekday?: string;
  start_time?: string;
  end_time?: string;
}
