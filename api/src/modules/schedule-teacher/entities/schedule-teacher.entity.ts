import { ApiProperty } from '@nestjs/swagger';
import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Schedule } from 'src/modules/schedule/entities/schedule.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Table({ tableName: 'schedule_teachers' })
export class ScheduleTeacher extends Model {
  @ApiProperty()
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ApiProperty()
  @ForeignKey(() => Schedule)
  @Column(DataType.INTEGER)
  schedule_id: number;

  @ApiProperty()
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  teacher_id: number;

  @ApiProperty({ type: () => Schedule })
  @BelongsTo(() => Schedule)
  schedule: Schedule;

  @ApiProperty({ type: () => User })
  @BelongsTo(() => User)
  teacher: User;
}
