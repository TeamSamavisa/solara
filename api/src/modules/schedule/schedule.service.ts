/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Schedule } from './entities/schedule.entity';
import { Shift } from '../shift/entities/shift.entity';
import { GetSchedulesQueryDto } from './dto/get-schedules.dto';
import { buildWhere } from 'src/utils/build-where';
import { PaginatedResponse } from 'src/utils/types/paginated-response';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectModel(Schedule)
    private readonly scheduleModel: typeof Schedule,
  ) {}

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const scheduleData = {
      weekday: createScheduleDto.weekday,
      start_time: createScheduleDto.start_time,
      end_time: createScheduleDto.end_time,
      shift_id: createScheduleDto.shift_id,
    };

    const schedule = await this.scheduleModel.create(scheduleData);
    return schedule.toJSON();
  }

  async list(
    query: GetSchedulesQueryDto,
  ): Promise<PaginatedResponse<Schedule>> {
    const { limit, offset, page, ...filter } = query;

    const result = await this.scheduleModel.findAndCountAll({
      where: buildWhere(filter),
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Shift,
          as: 'shift',
          attributes: ['id', 'name'],
        },
      ],
    });

    const totalItems = result.count;
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const content = result.rows.map((row) => row.toJSON());

    return {
      content,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  async getById(id: number) {
    const schedule = await this.scheduleModel.findByPk(id, {
      include: [
        {
          model: Shift,
          as: 'shift',
          attributes: ['id', 'name'],
        },
      ],
    });
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }
    return schedule.toJSON();
  }

  async update(
    id: number,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<Schedule> {
    const schedule = await this.ensureRecordExists(id);

    const updateData: Partial<Schedule> = {};

    if (updateScheduleDto.weekday !== undefined) {
      updateData.weekday = updateScheduleDto.weekday;
    }

    if (updateScheduleDto.start_time !== undefined) {
      updateData.start_time = updateScheduleDto.start_time;
    }

    if (updateScheduleDto.end_time !== undefined) {
      updateData.end_time = updateScheduleDto.end_time;
    }

    if (updateScheduleDto.shift_id !== undefined) {
      updateData.shift_id = updateScheduleDto.shift_id;
    }

    await schedule.update(updateData);
    return schedule.reload();
  }

  async remove(id: number) {
    const schedule = await this.ensureRecordExists(id);
    await schedule.destroy();
    return schedule;
  }

  private async ensureRecordExists(id: number): Promise<Schedule> {
    const schedule = await this.scheduleModel.findByPk(id);
    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }
    return schedule;
  }
}
