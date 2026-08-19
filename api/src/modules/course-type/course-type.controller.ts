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
import { CourseTypeService } from './course-type.service';
import { CreateCourseTypeDto } from './dto/create-course-type.dto';
import { UpdateCourseTypeDto } from './dto/update-course-type.dto';
import { GetCourseTypesQueryDto } from './dto/get-course-types.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CourseType } from './entities/course-type.entity';
import { ApiPaginatedResponse } from 'src/utils/decorators/api-paginated-response.decorator';

@ApiTags('Course Types')
@Controller('course-type')
export class CourseTypeController {
  constructor(private readonly courseTypeService: CourseTypeService) {}

  @Post()
  @ApiCreatedResponse({
    type: CourseType,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new course type',
    description: 'Creates a new course type with the provided data.',
  })
  @ApiBody({
    type: CreateCourseTypeDto,
    description: 'Course Type data transfer object',
  })
  @ApiResponse({
    status: 201,
    description: 'Course type created successfully',
    type: CourseType,
  })
  @ApiResponse({
    status: 422,
    description: 'Data failed validation',
  })
  create(@Body() createCourseTypeDto: CreateCourseTypeDto) {
    return this.courseTypeService.create(createCourseTypeDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all CourseTypes',
    description: 'Retrieves a list of all course types with their details.',
  })
  @ApiPaginatedResponse(CourseType)
  @ApiResponse({
    status: 404,
    description: 'No course type found',
  })
  list(@Query() query: GetCourseTypesQueryDto) {
    return this.courseTypeService.list(query);
  }

  @Get(':id')
  @ApiOkResponse({
    type: CourseType,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get course type by ID',
    description: 'Retrieves a specific course type by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'CourseType ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'CourseType found',
    type: CourseType,
  })
  @ApiResponse({
    status: 404,
    description: 'CourseType not found',
  })
  getById(@Param('id') id: string) {
    return this.courseTypeService.getById(+id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: CourseType,
  })
  @ApiOperation({
    summary: 'Update CourseType',
    description: "Updates a course type's information by their ID.",
  })
  @ApiParam({
    name: 'id',
    description: 'CourseType ID to update',
    type: Number,
  })
  @ApiBody({
    type: UpdateCourseTypeDto,
    description: 'Updated course type data',
  })
  @ApiResponse({
    status: 200,
    description: 'CourseType updated successfully',
    type: CourseType,
  })
  @ApiResponse({
    status: 404,
    description: 'CourseType not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateCourseTypeDto: UpdateCourseTypeDto,
  ) {
    return this.courseTypeService.update(+id, updateCourseTypeDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'CourseType ID to delete',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove CourseType',
    description: 'Removes a course type from the system by their ID.',
  })
  @ApiResponse({
    status: 204,
    description: 'CourseType removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'CourseType not found',
  })
  remove(@Param('id') id: string) {
    return this.courseTypeService.remove(+id);
  }
}
