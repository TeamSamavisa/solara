import type { CreateClassGroup } from './create-class-group';

export interface UpdateClassGroup extends Partial<CreateClassGroup> {
  id: number;
}
