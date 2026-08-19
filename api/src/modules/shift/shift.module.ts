import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ShiftService } from './shift.service';
import { ShiftController } from './shift.controller';
import { Shift } from './entities/shift.entity';

@Module({
  imports: [SequelizeModule.forFeature([Shift])],
  controllers: [ShiftController],
  providers: [ShiftService],
  exports: [SequelizeModule],
})
export class ShiftModule {}
