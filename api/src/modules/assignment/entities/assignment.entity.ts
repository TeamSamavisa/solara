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
  BelongsToMany,
} from 'sequelize-typescript';
import { ClassGroup } from 'src/modules/class-group/entities/class-group.entity';
import { Schedule } from 'src/modules/schedule/entities/schedule.entity';
import { Space } from 'src/modules/space/entities/space.entity';
import { Subject } from 'src/modules/subject/entities/subject.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { AssignmentSchedule } from './assignment-schedule.entity';

@Table({ tableName: 'assignments' })
export class Assignment extends Model {
  @ApiProperty()
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ApiProperty()
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  teacher_id: number;

  @ApiProperty()
  @ForeignKey(() => Subject)
  @Column(DataType.INTEGER)
  subject_id: number;

  @ApiProperty()
  @ForeignKey(() => Space)
  @Column({ type: DataType.INTEGER, allowNull: true })
  space_id: number | null;

  @ApiProperty()
  @ForeignKey(() => ClassGroup)
  @Column(DataType.INTEGER)
  class_group_id: number;

  @ApiProperty({ default: 2 })
  @Column({
    type: DataType.INTEGER,
    defaultValue: 2,
    allowNull: false,
  })
  duration: number;

  @ApiProperty({ type: () => [Schedule] })
  @BelongsToMany(() => Schedule, () => AssignmentSchedule)
  schedules: Schedule[];

  @ApiProperty({ type: () => User })
  @BelongsTo(() => User)
  teacher: User;

  @ApiProperty({ type: () => Subject })
  @BelongsTo(() => Subject)
  subject: Subject;

  @ApiProperty({ type: () => Space })
  @BelongsTo(() => Space)
  space: Space;

  @ApiProperty({ type: () => ClassGroup })
  @BelongsTo(() => ClassGroup)
  classGroup: ClassGroup;
}
