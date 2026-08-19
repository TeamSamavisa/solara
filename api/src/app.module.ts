import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { RabbitMQModule } from './modules/rabbitmq/rabbitmq.module';
import { AuthModule } from './modules/auth/auth.module';
import { AssignmentModule } from 'src/modules/assignment/assignment.module';
import { ClassGroupModule } from 'src/modules/class-group/class-group.module';
import { CourseModule } from 'src/modules/course/course.module';
import { CourseTypeModule } from 'src/modules/course-type/course-type.module';
import { ShiftModule } from 'src/modules/shift/shift.module';
import { SpaceTypeModule } from 'src/modules/space-type/space-type.module';
import { SubjectModule } from 'src/modules/subject/subject.module';
import { UserModule } from 'src/modules/user/user.module';
import { ScheduleTeacherModule } from 'src/modules/schedule-teacher/schedule-teacher.module';
import { SequelizeConfigService } from 'src/database/sequelize-config.service';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { SpaceModule } from './modules/space/space.module';
import { TimetablingModule } from './modules/timetabling/timetabling.module';
import { TaskModule } from './modules/task/task.module';
import appConfig from 'src/config/app.config';
import databaseConfig from 'src/database/config/database.config';
import authConfig from './modules/auth/config/auth.config';
import rabbitmqConfig from './modules/rabbitmq/config/rabbitmq.config';

@Module({
  imports: [
    RabbitMQModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig, appConfig, databaseConfig, rabbitmqConfig],
      envFilePath: ['.env'],
    }),
    SequelizeModule.forRootAsync({
      useClass: SequelizeConfigService,
    }),
    AuthModule,
    AssignmentModule,
    ClassGroupModule,
    CourseModule,
    CourseTypeModule,
    ScheduleModule,
    ShiftModule,
    SpaceTypeModule,
    SpaceModule,
    SubjectModule,
    UserModule,
    ScheduleTeacherModule,
    TimetablingModule,
    TaskModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
