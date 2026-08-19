import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSchedule } from './entities/assignment-schedule.entity';

@Module({
  imports: [SequelizeModule.forFeature([Assignment, AssignmentSchedule])],
  controllers: [AssignmentController],
  providers: [AssignmentService],
  exports: [SequelizeModule],
})
export class AssignmentModule {}
