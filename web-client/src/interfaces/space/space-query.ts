import type { BaseQuery } from '../base-query';

export interface SpaceQuery extends BaseQuery {
  name?: string;
  floor?: number;
  capacity?: number;
  blocked?: boolean;
  space_type_id?: number;
}
