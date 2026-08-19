import { Type, applyDecorators } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginationMeta } from '../types/paginated-response';

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              content: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              pagination: {
                $ref: getSchemaPath(PaginationMeta),
              },
            },
          },
        ],
      },
    }),
  );
};
