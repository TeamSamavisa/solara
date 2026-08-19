import { Controller, Get, Post, Body, Patch, Param } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('tasks')
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Get('last')
  @ApiOperation({ summary: 'Get most recent task' })
  @ApiResponse({ status: 200, description: 'Returns the most recent task' })
  @ApiResponse({ status: 404, description: 'No tasks found' })
  getLastTask() {
    return this.taskService.getLastTask();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by id' })
  @ApiResponse({ status: 200, description: 'Return task' })
  findOne(@Param('id') id: number) {
    return this.taskService.getTaskStatus(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task status and result' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  update(@Param('id') id: number, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.updateTaskStatus(id, updateTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'Return all tasks' })
  findAll() {
    return this.taskService.findAll();
  }
}
