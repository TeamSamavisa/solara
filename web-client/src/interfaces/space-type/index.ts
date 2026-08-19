import type { Space } from '../space';
import type { Subject } from '../subject';

export interface SpaceType {
  id: number;
  name: string;
  spaces?: Space[];
  subjects?: Subject[];
}
