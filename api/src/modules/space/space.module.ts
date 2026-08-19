import { Module } from '@nestjs/common';
import { SpaceService } from './space.service';
import { SpaceController } from './space.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Space } from './entities/space.entity';

@Module({
  imports: [SequelizeModule.forFeature([Space])],
  controllers: [SpaceController],
  providers: [SpaceService],
  exports: [SequelizeModule],
})
export class SpaceModule {}
