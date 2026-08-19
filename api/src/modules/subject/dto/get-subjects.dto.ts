import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { BaseQueryDto } from 'src/utils/dto/base-query.dto';

export class GetSubjectsQueryDto extends BaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  required_space_type_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  course_id?: number;
}
