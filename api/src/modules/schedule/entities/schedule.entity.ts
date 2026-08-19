import { ApiProperty } from '@nestjs/swagger';
import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  BelongsToMany,
  BelongsTo,
  ForeignKey,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Assignment } from 'src/modules/assignment/entities/assignment.entity';
import { AssignmentSchedule } from 'src/modules/assignment/entities/assignment-schedule.entity';
import { ScheduleTeacher } from 'src/modules/schedule-teacher/entities/schedule-teacher.entity';
import { Shift } from 'src/modules/shift/entities/shift.entity';

@Table({ tableName: 'schedules' })
export class Schedule extends Model {
  @ApiProperty()
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ApiProperty()
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  weekday: string;

  @ApiProperty()
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  start_time: string;

  @ApiProperty()
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  end_time: string;

  @ApiProperty()
  @ForeignKey(() => Shift)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  shift_id: number;

  @BelongsTo(() => Shift)
  shift: Shift;

  @HasMany(() => ScheduleTeacher)
  scheduleTeachers: ScheduleTeacher[];

  @BelongsToMany(() => Assignment, () => AssignmentSchedule)
  assignments: Assignment[];
}
