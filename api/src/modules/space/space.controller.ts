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
import { SpaceService } from './space.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { GetSpacesQueryDto } from './dto/get-spaces.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Space } from './entities/space.entity';
import { ApiPaginatedResponse } from 'src/utils/decorators/api-paginated-response.decorator';

@ApiTags('Spaces')
@Controller('space')
export class SpaceController {
  constructor(private readonly spaceService: SpaceService) {}

  @Post()
  @ApiCreatedResponse({
    type: Space,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new space',
    description: 'Creates a new space with the provided data.',
  })
  @ApiBody({
    type: CreateSpaceDto,
    description: 'Space data transfer object',
  })
  @ApiResponse({
    status: 201,
    description: 'Space created successfully',
    type: Space,
  })
  @ApiResponse({
    status: 422,
    description: 'Data failed validation',
  })
  create(@Body() createSpaceDto: CreateSpaceDto) {
    return this.spaceService.create(createSpaceDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all Spaces',
    description: 'Retrieves a list of all spaces with their details.',
  })
  @ApiPaginatedResponse(Space)
  @ApiResponse({
    status: 404,
    description: 'No space found',
  })
  list(@Query() query: GetSpacesQueryDto) {
    return this.spaceService.list(query);
  }

  @Get(':id')
  @ApiOkResponse({
    type: Space,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get space by ID',
    description: 'Retrieves a specific space by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Space ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Space found',
    type: Space,
  })
  @ApiResponse({
    status: 404,
    description: 'Space not found',
  })
  getById(@Param('id') id: string) {
    return this.spaceService.getById(+id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: Space,
  })
  @ApiOperation({
    summary: 'Update Space',
    description: "Updates a space's information by their ID.",
  })
  @ApiParam({
    name: 'id',
    description: 'Space ID to update',
    type: Number,
  })
  @ApiBody({
    type: UpdateSpaceDto,
    description: 'Updated space data',
  })
  @ApiResponse({
    status: 200,
    description: 'Space updated successfully',
    type: Space,
  })
  @ApiResponse({
    status: 404,
    description: 'Space not found',
  })
  update(@Param('id') id: string, @Body() updateSpaceDto: UpdateSpaceDto) {
    return this.spaceService.update(+id, updateSpaceDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Space ID to delete',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove Space',
    description: 'Removes a space from the system by their ID.',
  })
  @ApiResponse({
    status: 204,
    description: 'Space removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Space not found',
  })
  remove(@Param('id') id: string) {
    return this.spaceService.remove(+id);
  }
}
