import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TimetablingService } from './timetabling.service';
import { TimetablingController } from './timetabling.controller';

// Import entities
import { Assignment } from '../assignment/entities/assignment.entity';
import { AssignmentSchedule } from '../assignment/entities/assignment-schedule.entity';
import { Space } from '../space/entities/space.entity';
import { SpaceType } from '../space-type/entities/space-type.entity';
import { CourseType } from '../course-type/entities/course-type.entity';
import { Course } from '../course/entities/course.entity';
import { Shift } from '../shift/entities/shift.entity';
import { User } from '../user/entities/user.entity';
import { Subject } from '../subject/entities/subject.entity';
import { Schedule } from '../schedule/entities/schedule.entity';
import { ClassGroup } from '../class-group/entities/class-group.entity';
import { ScheduleTeacher } from '../schedule-teacher/entities/schedule-teacher.entity';

// Import RabbitMQ module
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

// Import Task module
import { TaskModule } from '../task/task.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Assignment,
      AssignmentSchedule,
      Space,
      SpaceType,
      CourseType,
      Course,
      Shift,
      User,
      Subject,
      Schedule,
      ClassGroup,
      ScheduleTeacher,
    ]),
    RabbitMQModule,
    TaskModule,
  ],
  controllers: [TimetablingController],
  providers: [TimetablingService],
  exports: [TimetablingService],
})
export class TimetablingModule {}
