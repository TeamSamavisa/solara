import type { Assignment } from '../assignment';
import type { SpaceType } from '../space-type';

export interface Space {
  id: number;
  name: string;
  floor: number;
  capacity: number;
  blocked: boolean;
  space_type_id: number;
  spaceType: SpaceType;
  assignments?: Assignment[];
}
