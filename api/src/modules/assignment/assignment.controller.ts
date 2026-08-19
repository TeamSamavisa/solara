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
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { GetAssignmentsQueryDto } from './dto/get-assignments.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Assignment } from './entities/assignment.entity';
import { ApiPaginatedResponse } from 'src/utils/decorators/api-paginated-response.decorator';

@ApiTags('Assignments')
@Controller('assignment')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @ApiCreatedResponse({
    type: Assignment,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new assignment',
    description: 'Creates a new assignment with the provided data.',
  })
  @ApiBody({
    type: CreateAssignmentDto,
    description: 'Assignment data transfer object',
  })
  @ApiResponse({
    status: 201,
    description: 'Assignment created successfully',
    type: Assignment,
  })
  @ApiResponse({
    status: 422,
    description: 'Data failed validation',
  })
  create(@Body() createAssignmentDto: CreateAssignmentDto) {
    return this.assignmentService.create(createAssignmentDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all Assignments',
    description: 'Retrieves a list of all assignments with their details.',
  })
  @ApiPaginatedResponse(Assignment)
  @ApiResponse({
    status: 404,
    description: 'No assignment found',
  })
  list(@Query() query: GetAssignmentsQueryDto) {
    return this.assignmentService.list(query);
  }

  @Get(':id')
  @ApiOkResponse({
    type: Assignment,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get assignment by ID',
    description: 'Retrieves a specific assignment by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Assignment ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment found',
    type: Assignment,
  })
  @ApiResponse({
    status: 404,
    description: 'Assignment not found',
  })
  getById(@Param('id') id: string) {
    return this.assignmentService.getById(+id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: Assignment,
  })
  @ApiOperation({
    summary: 'Update Assignment',
    description: "Updates a assignment's information by their ID.",
  })
  @ApiParam({
    name: 'id',
    description: 'Assignment ID to update',
    type: Number,
  })
  @ApiBody({
    type: UpdateAssignmentDto,
    description: 'Updated assignment data',
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment updated successfully',
    type: Assignment,
  })
  @ApiResponse({
    status: 404,
    description: 'Assignment not found',
  })
  update(
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ) {
    return this.assignmentService.update(+id, updateAssignmentDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Assignment ID to delete',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove Assignment',
    description: 'Removes a assignment from the system by their ID.',
  })
  @ApiResponse({
    status: 204,
    description: 'Assignment removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Assignment not found',
  })
  remove(@Param('id') id: string) {
    return this.assignmentService.remove(+id);
  }
}
