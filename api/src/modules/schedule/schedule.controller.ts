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
import { ScheduleService } from './schedule.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { GetSchedulesQueryDto } from './dto/get-schedules.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Schedule } from './entities/schedule.entity';
import { ApiPaginatedResponse } from 'src/utils/decorators/api-paginated-response.decorator';

@ApiTags('Schedules')
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @ApiCreatedResponse({
    type: Schedule,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new Schedule',
    description: 'Creates a new schedule with the provided data.',
  })
  @ApiBody({
    type: CreateScheduleDto,
    description: 'Schedule data transfer object',
  })
  @ApiResponse({
    status: 201,
    description: 'Schedule created successfully',
    type: Schedule,
  })
  @ApiResponse({
    status: 422,
    description: 'Data failed validation',
  })
  create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(createScheduleDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all Schedules',
    description: 'Retrieves a list of all schedules with their details.',
  })
  @ApiPaginatedResponse(Schedule)
  @ApiResponse({
    status: 404,
    description: 'No schedule found',
  })
  list(@Query() query: GetSchedulesQueryDto) {
    return this.scheduleService.list(query);
  }

  @Get(':id')
  @ApiOkResponse({
    type: Schedule,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get schedule by ID',
    description: 'Retrieves a specific schedule by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Schedule ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Schedule found',
    type: Schedule,
  })
  @ApiResponse({
    status: 404,
    description: 'Schedule not found',
  })
  getById(@Param('id') id: string) {
    return this.scheduleService.getById(+id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: Schedule,
  })
  @ApiOperation({
    summary: 'Update Schedule',
    description: "Updates a schedule's information by their ID.",
  })
  @ApiParam({
    name: 'id',
    description: 'Schedule ID to update',
    type: Number,
  })
  @ApiBody({
    type: UpdateScheduleDto,
    description: 'Updated schedule data',
  })
  @ApiResponse({
    status: 200,
    description: 'Schedule updated successfully',
    type: Schedule,
  })
  @ApiResponse({
    status: 404,
    description: 'Schedule not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ) {
    return this.scheduleService.update(+id, updateScheduleDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Schedule ID to delete',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove Schedule',
    description: 'Removes a schedule from the system by their ID.',
  })
  @ApiResponse({
    status: 204,
    description: 'Schedule removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Schedule not found',
  })
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(+id);
  }
}
