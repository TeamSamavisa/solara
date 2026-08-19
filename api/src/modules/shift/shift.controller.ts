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
import { ShiftService } from './shift.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { GetShiftsQueryDto } from './dto/get-shifts.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Shift } from './entities/shift.entity';
import { ApiPaginatedResponse } from 'src/utils/decorators/api-paginated-response.decorator';

@ApiTags('Shifts')
@Controller('shift')
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  @ApiCreatedResponse({
    type: Shift,
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new shift',
    description: 'Creates a new shift with the provided data.',
  })
  @ApiBody({
    type: CreateShiftDto,
    description: 'Shift data transfer object',
  })
  @ApiResponse({
    status: 201,
    description: 'Shift created successfully',
    type: Shift,
  })
  @ApiResponse({
    status: 422,
    description: 'Data failed validation',
  })
  create(@Body() createShiftDto: CreateShiftDto) {
    return this.shiftService.create(createShiftDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all Shifts',
    description: 'Retrieves a list of all shifts with their details.',
  })
  @ApiPaginatedResponse(Shift)
  @ApiResponse({
    status: 404,
    description: 'No shift found',
  })
  list(@Query() query: GetShiftsQueryDto) {
    return this.shiftService.list(query);
  }

  @Get(':id')
  @ApiOkResponse({
    type: Shift,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get shift by ID',
    description: 'Retrieves a specific shift by their ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Shift ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Shift found',
    type: Shift,
  })
  @ApiResponse({
    status: 404,
    description: 'Shift not found',
  })
  getById(@Param('id') id: string) {
    return this.shiftService.getById(+id);
  }

  @Patch(':id')
  @ApiOkResponse({
    type: Shift,
  })
  @ApiOperation({
    summary: 'Update Shift',
    description: "Updates a shift's information by their ID.",
  })
  @ApiParam({
    name: 'id',
    description: 'Shift ID to update',
    type: Number,
  })
  @ApiBody({
    type: UpdateShiftDto,
    description: 'Updated shift data',
  })
  @ApiResponse({
    status: 200,
    description: 'Shift updated successfully',
    type: Shift,
  })
  @ApiResponse({
    status: 404,
    description: 'Shift not found',
  })
  update(@Param('id') id: string, @Body() updateShiftDto: UpdateShiftDto) {
    return this.shiftService.update(+id, updateShiftDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Shift ID to delete',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove Shift',
    description: 'Removes a shift from the system by their ID.',
  })
  @ApiResponse({
    status: 204,
    description: 'Shift removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Shift not found',
  })
  remove(@Param('id') id: string) {
    return this.shiftService.remove(+id);
  }
}
