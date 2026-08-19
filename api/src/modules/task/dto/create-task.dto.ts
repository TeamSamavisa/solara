import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TaskType, TaskStatus } from '../entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Correlation ID for tracking the task',
    example: 'optimization-2024-11-22-123456',
  })
  @IsString()
  @IsNotEmpty()
  correlation_id: string;

  @ApiProperty({
    description: 'Type of task to be executed',
    enum: TaskType,
    example: TaskType.TIMETABLE_OPTIMIZATION,
  })
  @IsEnum(TaskType)
  @IsNotEmpty()
  type: TaskType;

  @ApiProperty({
    description: 'Initial status of the task',
    enum: TaskStatus,
    required: false,
    default: TaskStatus.PROCESSING,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;
}
