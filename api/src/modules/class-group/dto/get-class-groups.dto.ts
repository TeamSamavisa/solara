import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { BaseQueryDto } from 'src/utils/dto/base-query.dto';

export class GetClassGroupsQueryDto extends BaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  semester?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  student_count?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  shift_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  course_id?: number;
}
