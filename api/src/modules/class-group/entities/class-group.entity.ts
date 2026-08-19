import { ApiProperty } from '@nestjs/swagger';
import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  BelongsTo,
  ForeignKey,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Assignment } from 'src/modules/assignment/entities/assignment.entity';
import { Course } from 'src/modules/course/entities/course.entity';
import { Shift } from 'src/modules/shift/entities/shift.entity';

@Table({ tableName: 'class_groups' })
export class ClassGroup extends Model {
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
  name: string;

  @ApiProperty()
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  semester: string;

  @ApiProperty()
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  module: string;

  @ApiProperty()
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  student_count: number;

  @ApiProperty()
  @ForeignKey(() => Shift)
  @Column(DataType.INTEGER)
  shift_id: number;

  @ApiProperty()
  @ForeignKey(() => Course)
  @Column(DataType.INTEGER)
  course_id: number;

  @ApiProperty()
  @BelongsTo(() => Shift)
  shift: Shift;

  @ApiProperty()
  @BelongsTo(() => Course)
  course: Course;

  @HasMany(() => Assignment)
  assignments: Assignment[];
}
