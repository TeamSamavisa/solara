import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SpaceTypeService } from './space-type.service';
import { CreateSpaceTypeDto } from './dto/create-space-type.dto';
import { UpdateSpaceTypeDto } from './dto/update-space-type.dto';
import { GetSpaceTypesQueryDto } from './dto/get-space-types.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SpaceType } from './entities/space-type.entity';
import { ApiPaginatedResponse } from 'src/utils/decorators/api-paginated-response.decorator';

@ApiTags('Space Types')
@Controller('space-type')
export class SpaceTypeController {
  constructor(private readonly spaceTypeService: SpaceTypeService) {}

  @Post()
  @ApiCreatedResponse({
    type: SpaceType,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new space type',
    description: 'Creates a new space type with the provided data.',
  })
  @ApiBody({
    type: CreateSpaceTypeDto,
    description: 'Space Type data transfer object',
  })
  @ApiResponse({
    status: 201,
    description: 'SpaceType created successfully',
    type: SpaceType,
  })
  @ApiResponse({
    status: 422,
    description: 'Data failed validation',
  })
  create(@Body() createSpaceTypeDto: CreateSpaceTypeDto) {
    return this.spaceTypeService.create(createSpaceTypeDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all SpaceTypes',
    description: 'Retrieves a list of all space types with their details.',
  })
  @ApiPaginatedResponse(SpaceType)
  @ApiResponse({
    status: 404,
    description: 'No space type found',
  })
  list(@Query() query: GetSpaceTypesQueryDto) {
    return this.spaceTypeService.list(query);
  }

  @Get(':id')
  @ApiOkResponse({
    type: SpaceType,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get space type by ID',
    description: 'Retrieves a specific space type by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'SpaceType ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'SpaceType found',
    type: SpaceType,
  })
  @ApiResponse({
    status: 404,
    description: 'SpaceType not found',
  })
  getById(@Param('id') id: string) {
    return this.spaceTypeService.getById(+id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: SpaceType,
  })
  @ApiOperation({
    summary: 'Update SpaceType',
    description: "Updates a space type's information by their ID.",
  })
  @ApiParam({
    name: 'id',
    description: 'SpaceType ID to update',
    type: Number,
  })
  @ApiBody({
    type: UpdateSpaceTypeDto,
    description: 'Updated space type data',
  })
  @ApiResponse({
    status: 200,
    description: 'SpaceType updated successfully',
    type: SpaceType,
  })
  @ApiResponse({
    status: 404,
    description: 'SpaceType not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateSpaceTypeDto: UpdateSpaceTypeDto,
  ) {
    return this.spaceTypeService.update(+id, updateSpaceTypeDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'SpaceType ID to delete',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove SpaceType',
    description: 'Removes a space type from the system by their ID.',
  })
  @ApiResponse({
    status: 204,
    description: 'SpaceType removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'SpaceType not found',
  })
  remove(@Param('id') id: string) {
    return this.spaceTypeService.remove(+id);
  }
}
