import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  PrimaryKey,
  AutoIncrement,
} from 'sequelize-typescript';
import { Course } from '../../course/entities/course.entity';
import { ApiProperty } from '@nestjs/swagger';

@Table({ tableName: 'course_types' })
export class CourseType extends Model {
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

  @HasMany(() => Course)
  courses: Course[];
}
