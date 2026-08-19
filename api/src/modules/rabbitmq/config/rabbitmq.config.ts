import { RabbitMQConfig } from './rabbitmq-config.type';
import validateConfig from 'src/utils/validate-config';
import { registerAs } from '@nestjs/config';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

class EnvironmentVariablesValidator {
  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  RABBITMQ_PORT: number;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  RABBITMQ_MANAGEMENT_PORT: number;

  @IsString()
  @ValidateIf(
    (envValues: EnvironmentVariablesValidator) => !envValues.RABBITMQ_URL,
  )
  RABBITMQ_URL: string;

  @IsString()
  @ValidateIf(
    (envValues: EnvironmentVariablesValidator) => !envValues.RABBITMQ_URL,
  )
  RABBITMQ_QUEUE: string;
}

export default registerAs<RabbitMQConfig>('rabbitmq', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    port: process.env.RABBITMQ_PORT
      ? parseInt(process.env.RABBITMQ_PORT, 10)
      : 5672,
    managementPort: process.env.RABBITMQ_MANAGEMENT_PORT
      ? parseInt(process.env.RABBITMQ_MANAGEMENT_PORT, 10)
      : 15672,
    url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
    queue: process.env.RABBITMQ_QUEUE ?? 'allocation',
  };
});
