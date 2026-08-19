import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  itemsPerPage: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPrevPage: boolean;
}

export class PaginatedResponse<T> {
  @ApiProperty({ isArray: true })
  content: T[];

  @ApiProperty({ type: PaginationMeta })
  pagination: PaginationMeta;
}
