import type { CreateSubject } from './create-subject';

export interface UpdateSubject extends Partial<CreateSubject> {
  id: number;
}
