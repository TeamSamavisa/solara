import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseQueryDto } from 'src/utils/dto/base-query.dto';

export class GetUsersQueryDto extends BaseQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  registration?: string;
}
