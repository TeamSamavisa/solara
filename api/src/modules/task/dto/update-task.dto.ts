import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class UpdateTaskDto {
  @ApiProperty({
    description: 'Task status',
    enum: TaskStatus,
    required: false,
  })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiProperty({
    description: 'Task result data',
    required: false,
  })
  @IsOptional()
  result?: any;

  @ApiProperty({
    description: 'Error message if task failed',
    required: false,
  })
  @IsString()
  @IsOptional()
  error_message?: string;

  @ApiProperty({
    description: 'Task progress percentage (0-100)',
    required: false,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;
}
