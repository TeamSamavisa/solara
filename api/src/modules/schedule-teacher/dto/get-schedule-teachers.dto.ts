import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';
import { BaseQueryDto } from 'src/utils/dto/base-query.dto';

export class GetScheduleTeachersQueryDto extends BaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  schedule_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  teacher_id?: number;
}
