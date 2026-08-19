import { Module } from '@nestjs/common';
import { ClassGroupService } from './class-group.service';
import { ClassGroupController } from './class-group.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClassGroup } from './entities/class-group.entity';

@Module({
  imports: [SequelizeModule.forFeature([ClassGroup])],
  controllers: [ClassGroupController],
  providers: [ClassGroupService],
  exports: [SequelizeModule],
})
export class ClassGroupModule {}
