import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout, retry } from 'rxjs';

@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);

  constructor(
    @Inject('ASSIGNMENT_SERVICE')
    private readonly client: ClientProxy,
  ) {}

  async emitEvent(pattern: string, data: any): Promise<void> {
    try {
      await lastValueFrom(
        this.client.emit(pattern, data).pipe(timeout(5000), retry(3)),
      );
    } catch (error) {
      this.logger.error(`Failed to emit event ${pattern}:`, error);
      throw error;
    }
  }

  sendMessage(pattern: string, data: any) {
    return lastValueFrom(this.client.send(pattern, data));
  }
}
