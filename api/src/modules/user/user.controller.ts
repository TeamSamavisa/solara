import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersQueryDto } from './dto/get-users.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { ApiPaginatedResponse } from 'src/utils/decorators/api-paginated-response.decorator';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiCreatedResponse({
    type: User,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new user',
    description: 'Creates a new user with the provided data.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User data transfer object',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: User,
  })
  @ApiResponse({
    status: 409,
    description: 'Email/Registration already in use',
  })
  @ApiResponse({
    status: 422,
    description: 'Data failed validation',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieves a list of all users with their details.',
  })
  @ApiPaginatedResponse(User)
  @ApiResponse({
    status: 404,
    description: 'No user found',
  })
  list(@Query() query: GetUsersQueryDto) {
    return this.userService.list(query);
  }

  @Get('teachers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all teachers',
    description: 'Retrieves a list of all teachers with their details.',
  })
  @ApiPaginatedResponse(User)
  @ApiResponse({
    status: 404,
    description: 'No teacher found',
  })
  listTeachers(@Query() query: GetUsersQueryDto) {
    return this.userService.listTeachers(query);
  }

  @Get(':id')
  @ApiOkResponse({
    type: User,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user ID',
  })
  getById(@Param('id') id: string) {
    return this.userService.getById(+id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: User,
  })
  @ApiOperation({
    summary: 'Update user',
    description: "Updates a user's information by their ID.",
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to update',
    type: String,
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'Updated user data',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user ID',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Email/Registration already in use',
  })
  @ApiResponse({
    status: 422,
    description: 'Data failed validation',
  })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    description: 'User ID to delete',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove user',
    description: 'Removes a user from the system by their ID.',
  })
  @ApiResponse({
    status: 204,
    description: 'User removed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid user ID',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
