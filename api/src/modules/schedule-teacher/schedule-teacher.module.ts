import { Module } from '@nestjs/common';
import { ScheduleTeacherService } from './schedule-teacher.service';
import { ScheduleTeacherController } from './schedule-teacher.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleTeacher } from './entities/schedule-teacher.entity';

@Module({
  imports: [SequelizeModule.forFeature([ScheduleTeacher])],
  controllers: [ScheduleTeacherController],
  providers: [ScheduleTeacherService],
  exports: [SequelizeModule],
})
export class ScheduleTeacherModule {}
