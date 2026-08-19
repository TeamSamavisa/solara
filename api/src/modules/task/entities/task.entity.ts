import { ApiProperty } from '@nestjs/swagger';
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

export enum TaskStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TaskType {
  TIMETABLE_OPTIMIZATION = 'TIMETABLE_OPTIMIZATION',
}

@Table({ tableName: 'tasks' })
export class Task extends Model {
  @ApiProperty()
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ApiProperty()
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  correlation_id: string;

  @ApiProperty({ enum: TaskStatus })
  @Column({
    type: DataType.ENUM(...Object.values(TaskStatus)),
    allowNull: false,
    defaultValue: TaskStatus.PROCESSING,
  })
  status: TaskStatus;

  @ApiProperty({ enum: TaskType })
  @Column({
    type: DataType.ENUM(...Object.values(TaskType)),
    allowNull: false,
  })
  type: TaskType;

  @ApiProperty()
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  error_message: string;

  @ApiProperty()
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  progress: number;

  @ApiProperty()
  @CreatedAt
  @Column(DataType.DATE)
  created_at: Date;

  @ApiProperty()
  @UpdatedAt
  @Column(DataType.DATE)
  updated_at: Date;
}
