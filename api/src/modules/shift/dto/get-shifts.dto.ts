import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BaseQueryDto } from 'src/utils/dto/base-query.dto';

export class GetShiftsQueryDto extends BaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}
