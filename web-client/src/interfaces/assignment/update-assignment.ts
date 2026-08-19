import type { CreateAssignment } from './create-assignment';

export interface UpdateAssignment extends Partial<CreateAssignment> {
  id: number;
}
