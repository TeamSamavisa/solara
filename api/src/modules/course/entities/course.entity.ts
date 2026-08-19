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
import { CourseType } from 'src/modules/course-type/entities/course-type.entity';
import { ClassGroup } from 'src/modules/class-group/entities/class-group.entity';
import { Subject } from 'src/modules/subject/entities/subject.entity';
import { ApiProperty } from '@nestjs/swagger';

@Table({ tableName: 'courses' })
export class Course extends Model {
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
  @ForeignKey(() => CourseType)
  @Column(DataType.INTEGER)
  course_type_id: number;

  @ApiProperty()
  @BelongsTo(() => CourseType)
  courseType: CourseType;

  @HasMany(() => ClassGroup)
  classGroups: ClassGroup[];

  @HasMany(() => Subject)
  subjects: Subject[];
}
