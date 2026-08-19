import { Module } from '@nestjs/common';
import { SpaceTypeService } from './space-type.service';
import { SpaceTypeController } from './space-type.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { SpaceType } from './entities/space-type.entity';

@Module({
  imports: [SequelizeModule.forFeature([SpaceType])],
  controllers: [SpaceTypeController],
  providers: [SpaceTypeService],
  exports: [SequelizeModule],
})
export class SpaceTypeModule {}
