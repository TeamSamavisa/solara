import { User } from 'src/modules/user/entities/user.entity';

export type JwtPayloadType = Pick<User, 'id' | 'role'> & {
  iat: number;
  exp: number;
};
