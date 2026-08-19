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
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { GetCoursesQueryDto } from './dto/get-courses.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Course } from './entities/course.entity';
import { ApiPaginatedResponse } from 'src/utils/decorators/api-paginated-response.decorator';

@ApiTags('Courses')
@Controller('course')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiCreatedResponse({
    type: Course,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new course',
    description: 'Creates a new course with the provided data.',
  })
  @ApiBody({
    type: CreateCourseDto,
    description: 'Course data transfer object',
  })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
    type: Course,
  })
  @ApiResponse({
    status: 422,
    description: 'Data failed validation',
  })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.courseService.create(createCourseDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all Courses',
    description: 'Retrieves a list of all courses with their details.',
  })
  @ApiPaginatedResponse(Course)
  @ApiResponse({
    status: 404,
    description: 'No course found',
  })
  list(@Query() query: GetCoursesQueryDto) {
    return this.courseService.list(query);
  }

  @Get(':id')
  @ApiOkResponse({
    type: Course,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get course by ID',
    description: 'Retrieves a specific course by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Course ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Course found',
    type: Course,
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  getById(@Param('id') id: string) {
    return this.courseService.getById(+id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: Course,
  })
  @ApiOperation({
    summary: 'Update Course',
    description: "Updates a course's information by their ID.",
  })
  @ApiParam({
    name: 'id',
    description: 'Course ID to update',
    type: Number,
  })
  @ApiBody({
    type: UpdateCourseDto,
    description: 'Updated course data',
  })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
    type: Course,
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.courseService.update(+id, updateCourseDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Course ID to delete',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove Course',
    description: 'Removes a course from the system by their ID.',
  })
  @ApiResponse({
    status: 204,
    description: 'Course removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  remove(@Param('id') id: string) {
    return this.courseService.remove(+id);
  }
}
