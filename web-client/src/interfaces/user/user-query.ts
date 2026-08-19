import type { BaseQuery } from '../base-query';

export interface UserQuery extends BaseQuery {
  full_name?: string;
  email?: string;
  registration?: string;
}
