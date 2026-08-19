import { DatabaseConfig } from 'src/database/config/database-config.type';
import { AppConfig } from './app-config.type';
import { AuthConfig } from 'src/modules/auth/config/auth-config.type';

export type AllConfigType = {
  app: AppConfig;
  auth: AuthConfig;
  database: DatabaseConfig;
};
