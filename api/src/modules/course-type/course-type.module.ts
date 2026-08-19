import { Module } from '@nestjs/common';
import { CourseTypeService } from './course-type.service';
import { CourseTypeController } from './course-type.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { CourseType } from './entities/course-type.entity';

@Module({
  imports: [SequelizeModule.forFeature([CourseType])],
  controllers: [CourseTypeController],
  providers: [CourseTypeService],
  exports: [SequelizeModule],
})
export class CourseTypeModule {}
