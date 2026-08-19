import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Schedule } from './entities/schedule.entity';

@Module({
  imports: [SequelizeModule.forFeature([Schedule])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [SequelizeModule],
})
export class ScheduleModule {}
