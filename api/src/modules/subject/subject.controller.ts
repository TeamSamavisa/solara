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
import { SubjectService } from './subject.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { GetSubjectsQueryDto } from './dto/get-subjects.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Subject } from './entities/subject.entity';
import { ApiPaginatedResponse } from 'src/utils/decorators/api-paginated-response.decorator';

@ApiTags('Subjects')
@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  @ApiCreatedResponse({
    type: Subject,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new subject',
    description: 'Creates a new subject with the provided data.',
  })
  @ApiBody({
    type: CreateSubjectDto,
    description: 'Subject data transfer object',
  })
  @ApiResponse({
    status: 201,
    description: 'Subject created successfully',
    type: Subject,
  })
  @ApiResponse({
    status: 422,
    description: 'Data failed validation',
  })
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectService.create(createSubjectDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all Subjects',
    description: 'Retrieves a list of all subjects with their details.',
  })
  @ApiPaginatedResponse(Subject)
  @ApiResponse({
    status: 404,
    description: 'No subject found',
  })
  list(@Query() query: GetSubjectsQueryDto) {
    return this.subjectService.list(query);
  }

  @Get(':id')
  @ApiOkResponse({
    type: Subject,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get subject by ID',
    description: 'Retrieves a specific subject by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Subject ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Subject found',
    type: Subject,
  })
  @ApiResponse({
    status: 404,
    description: 'Subject not found',
  })
  getById(@Param('id') id: string) {
    return this.subjectService.getById(+id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: Subject,
  })
  @ApiOperation({
    summary: 'Update Subject',
    description: "Updates a subject's information by their ID.",
  })
  @ApiParam({
    name: 'id',
    description: 'Subject ID to update',
    type: Number,
  })
  @ApiBody({
    type: UpdateSubjectDto,
    description: 'Updated subject data',
  })
  @ApiResponse({
    status: 200,
    description: 'Subject updated successfully',
    type: Subject,
  })
  @ApiResponse({
    status: 404,
    description: 'Subject not found',
  })
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectService.update(+id, updateSubjectDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Subject ID to delete',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove Subject',
    description: 'Removes a subject from the system by their ID.',
  })
  @ApiResponse({
    status: 204,
    description: 'Subject removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Subject not found',
  })
  remove(@Param('id') id: string) {
    return this.subjectService.remove(+id);
  }
}
