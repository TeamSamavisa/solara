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
import { SpaceType } from 'src/modules/space-type/entities/space-type.entity';

@Table({ tableName: 'subjects' })
export class Subject extends Model {
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
  @ForeignKey(() => SpaceType)
  @Column(DataType.INTEGER)
  required_space_type_id: number;

  @ApiProperty()
  @ForeignKey(() => Course)
  @Column(DataType.INTEGER)
  course_id: number;

  @ApiProperty()
  @BelongsTo(() => SpaceType)
  requiredSpaceType: SpaceType;

  @ApiProperty({ type: () => Course })
  @BelongsTo(() => Course)
  course: Course;

  @HasMany(() => Assignment)
  assignments: Assignment[];
}
