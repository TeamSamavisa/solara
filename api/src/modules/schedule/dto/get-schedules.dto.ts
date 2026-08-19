import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { BaseQueryDto } from 'src/utils/dto/base-query.dto';

export class GetSchedulesQueryDto extends BaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  weekday?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'start_time must be in HH:mm format',
  })
  start_time?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'end_time must be in HH:mm format',
  })
  end_time?: string;
}
