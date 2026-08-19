import type { ClassGroup } from '../class-group';

export interface Shift {
  id: number;
  name: string;
  classGroups?: ClassGroup[];
}
