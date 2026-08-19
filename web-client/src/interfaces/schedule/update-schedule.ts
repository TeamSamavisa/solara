import type { CreateSchedule } from './create-schedule';

export interface UpdateSchedule extends Partial<CreateSchedule> {
  id: number;
}
