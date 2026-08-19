import { ApiProperty } from '@nestjs/swagger';
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  PrimaryKey,
  AutoIncrement,
  BelongsTo,
} from 'sequelize-typescript';
import { Assignment } from './assignment.entity';
import { Schedule } from 'src/modules/schedule/entities/schedule.entity';

@Table({ tableName: 'assignment_schedules' })
export class AssignmentSchedule extends Model {
  @ApiProperty()
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ApiProperty()
  @ForeignKey(() => Assignment)
  @Column({ type: DataType.INTEGER, allowNull: false })
  assignment_id: number;

  @ApiProperty()
  @ForeignKey(() => Schedule)
  @Column({ type: DataType.INTEGER, allowNull: false })
  schedule_id: number;

  @BelongsTo(() => Assignment)
  assignment: Assignment;

  @BelongsTo(() => Schedule)
  schedule: Schedule;
}
