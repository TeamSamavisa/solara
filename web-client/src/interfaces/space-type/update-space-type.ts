import type { CreateSpaceType } from './create-space-type';

export interface UpdateSpaceType extends Partial<CreateSpaceType> {
  id: number;
}
