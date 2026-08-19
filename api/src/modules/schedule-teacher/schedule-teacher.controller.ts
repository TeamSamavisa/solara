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
import { ScheduleTeacherService } from './schedule-teacher.service';
import { CreateScheduleTeacherDto } from './dto/create-schedule-teacher.dto';
import { UpdateScheduleTeacherDto } from './dto/update-schedule-teacher.dto';
import { GetScheduleTeachersQueryDto } from './dto/get-schedule-teachers.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ScheduleTeacher } from './entities/schedule-teacher.entity';
import { ApiPaginatedResponse } from 'src/utils/decorators/api-paginated-response.decorator';

@ApiTags('Schedule Teachers')
@Controller('schedule-teacher')
export class ScheduleTeacherController {
  constructor(
    private readonly scheduleTeacherService: ScheduleTeacherService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: ScheduleTeacher,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new association betweeen schedule and teacher',
    description:
      'Creates a new association betweeen schedule and teacher with the provided data.',
  })
  @ApiBody({
    type: CreateScheduleTeacherDto,
    description: 'ScheduleTeacher data transfer object',
  })
  @ApiResponse({
    status: 201,
    description: 'ScheduleTeacher created successfully',
    type: ScheduleTeacher,
  })
  @ApiResponse({
    status: 422,
    description: 'Data failed validation',
  })
  create(@Body() createScheduleTeacherDto: CreateScheduleTeacherDto) {
    return this.scheduleTeacherService.create(createScheduleTeacherDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all ScheduleTeachers',
    description:
      'Retrieves a list of all associations betweeen schedules and teachers with their details.',
  })
  @ApiPaginatedResponse(ScheduleTeacher)
  @ApiResponse({
    status: 404,
    description: 'No subject found',
  })
  list(@Query() query: GetScheduleTeachersQueryDto) {
    return this.scheduleTeacherService.list(query);
  }

  @Get(':id')
  @ApiOkResponse({
    type: ScheduleTeacher,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get association betweeen schedule and teacher by ID',
    description:
      'Retrieves a specific association betweeen schedule and teacher by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ScheduleTeacher ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'ScheduleTeacher found',
    type: ScheduleTeacher,
  })
  @ApiResponse({
    status: 404,
    description: 'ScheduleTeacher not found',
  })
  getById(@Param('id') id: string) {
    return this.scheduleTeacherService.getById(+id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: ScheduleTeacher,
  })
  @ApiOperation({
    summary: 'Update ScheduleTeacher',
    description:
      'Updates an association betweeen schedule and teacher by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'ScheduleTeacher ID to update',
    type: Number,
  })
  @ApiBody({
    type: UpdateScheduleTeacherDto,
    description: 'Updated association betweeen schedule and teacher data',
  })
  @ApiResponse({
    status: 200,
    description: 'ScheduleTeacher updated successfully',
    type: ScheduleTeacher,
  })
  @ApiResponse({
    status: 404,
    description: 'ScheduleTeacher not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateScheduleTeacherDto: UpdateScheduleTeacherDto,
  ) {
    return this.scheduleTeacherService.update(+id, updateScheduleTeacherDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ScheduleTeacher ID to delete',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove ScheduleTeacher',
    description:
      'Removes an association betweeen schedule and teacher from the system by their ID.',
  })
  @ApiResponse({
    status: 204,
    description: 'ScheduleTeacher removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'ScheduleTeacher not found',
  })
  remove(@Param('id') id: string) {
    return this.scheduleTeacherService.remove(+id);
  }
}
