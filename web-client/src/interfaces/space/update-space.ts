import type { CreateSpace } from './create-space';

export interface UpdateSpace extends Partial<CreateSpace> {
  id: number;
}
