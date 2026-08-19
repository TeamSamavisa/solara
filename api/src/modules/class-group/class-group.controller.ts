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
import { ClassGroupService } from './class-group.service';
import { CreateClassGroupDto } from './dto/create-class-group.dto';
import { UpdateClassGroupDto } from './dto/update-class-group.dto';
import { GetClassGroupsQueryDto } from './dto/get-class-groups.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClassGroup } from './entities/class-group.entity';
import { ApiPaginatedResponse } from 'src/utils/decorators/api-paginated-response.decorator';

@ApiTags('Class Groups')
@Controller('class-group')
export class ClassGroupController {
  constructor(private readonly classGroupService: ClassGroupService) {}

  @Post()
  @ApiCreatedResponse({
    type: ClassGroup,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new class group',
    description: 'Creates a new class group with the provided data.',
  })
  @ApiBody({
    type: CreateClassGroupDto,
    description: 'Class group data transfer object',
  })
  @ApiResponse({
    status: 201,
    description: 'Class group created successfully',
    type: ClassGroup,
  })
  @ApiResponse({
    status: 422,
    description: 'Data failed validation',
  })
  create(@Body() createClassGroupDto: CreateClassGroupDto) {
    return this.classGroupService.create(createClassGroupDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all ClassGroups',
    description: 'Retrieves a list of all class groups with their details.',
  })
  @ApiPaginatedResponse(ClassGroup)
  @ApiResponse({
    status: 404,
    description: 'No class group found',
  })
  list(@Query() query: GetClassGroupsQueryDto) {
    return this.classGroupService.list(query);
  }

  @Get(':id')
  @ApiOkResponse({
    type: ClassGroup,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get class group by ID',
    description: 'Retrieves a specific class group by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ClassGroup ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'ClassGroup found',
    type: ClassGroup,
  })
  @ApiResponse({
    status: 404,
    description: 'ClassGroup not found',
  })
  getById(@Param('id') id: string) {
    return this.classGroupService.getById(+id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: ClassGroup,
  })
  @ApiOperation({
    summary: 'Update ClassGroup',
    description: "Updates a class group's information by their ID.",
  })
  @ApiParam({
    name: 'id',
    description: 'ClassGroup ID to update',
    type: Number,
  })
  @ApiBody({
    type: UpdateClassGroupDto,
    description: 'Updated class group data',
  })
  @ApiResponse({
    status: 200,
    description: 'ClassGroup updated successfully',
    type: ClassGroup,
  })
  @ApiResponse({
    status: 404,
    description: 'ClassGroup not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateClassGroupDto: UpdateClassGroupDto,
  ) {
    return this.classGroupService.update(+id, updateClassGroupDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ClassGroup ID to delete',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove ClassGroup',
    description: 'Removes a class group from the system by their ID.',
  })
  @ApiResponse({
    status: 204,
    description: 'ClassGroup removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'ClassGroup not found',
  })
  remove(@Param('id') id: string) {
    return this.classGroupService.remove(+id);
  }
}
