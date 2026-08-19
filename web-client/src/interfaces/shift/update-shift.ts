import type { CreateShift } from './create-shift';

export interface UpdateShift extends Partial<CreateShift> {
  id: number;
}
