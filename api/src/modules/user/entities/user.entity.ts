import { ApiProperty } from '@nestjs/swagger';
import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  PrimaryKey,
  AutoIncrement,
  Scopes,
} from 'sequelize-typescript';
import { Assignment } from 'src/modules/assignment/entities/assignment.entity';
import { ScheduleTeacher } from 'src/modules/schedule-teacher/entities/schedule-teacher.entity';

@Scopes(() => ({
  defaultScope: {
    attributes: { exclude: ['password_hash'] },
  },
  withPassword: {
    attributes: { include: ['password_hash'] },
  },
}))
@Table({ tableName: 'users' })
export class User extends Model {
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
  full_name: string;

  @ApiProperty()
  @Column({
    type: DataType.STRING,
    unique: true,
  })
  registration: string;

  @ApiProperty()
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email: string;

  @ApiProperty()
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  role: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password_hash: string;

  @HasMany(() => ScheduleTeacher)
  scheduleTeachers: ScheduleTeacher[];

  @HasMany(() => Assignment)
  assignments: Assignment[];
}
