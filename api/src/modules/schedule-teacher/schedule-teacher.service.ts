import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateScheduleTeacherDto } from './dto/create-schedule-teacher.dto';
import { UpdateScheduleTeacherDto } from './dto/update-schedule-teacher.dto';
import { ScheduleTeacher } from './entities/schedule-teacher.entity';
import { InjectModel } from '@nestjs/sequelize';
import { GetScheduleTeachersQueryDto } from './dto/get-schedule-teachers.dto';
import { buildWhere } from 'src/utils/build-where';
import { PaginatedResponse } from 'src/utils/types/paginated-response';

@Injectable()
export class ScheduleTeacherService {
  constructor(
    @InjectModel(ScheduleTeacher)
    private readonly scheduleTeacherModel: typeof ScheduleTeacher,
  ) {}

  async create(
    createScheduleTeacherDto: CreateScheduleTeacherDto,
  ): Promise<ScheduleTeacher> {
    const scheduleTeacherData = {
      schedule_id: createScheduleTeacherDto.schedule_id,
      teacher_id: createScheduleTeacherDto.teacher_id,
    };

    const scheduleTeacher =
      await this.scheduleTeacherModel.create(scheduleTeacherData);
    return scheduleTeacher.get() as ScheduleTeacher;
  }

  async list(
    query: GetScheduleTeachersQueryDto,
  ): Promise<PaginatedResponse<ScheduleTeacher>> {
    const { limit, offset, page, ...filter } = query;

    const result = await this.scheduleTeacherModel.findAndCountAll({
      where: buildWhere(filter),
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: ['schedule', 'teacher'],
      raw: true,
    });

    const totalItems = result.count;
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      content: result.rows,
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
    const scheduleTeacher = await this.scheduleTeacherModel.findByPk(id, {
      include: ['schedule', 'teacher'],
      raw: true,
    });

    if (!scheduleTeacher) {
      throw new NotFoundException(
        'Association between teacher and schedule not found',
      );
    }

    return scheduleTeacher;
  }

  async update(
    id: number,
    updateScheduleTeacherDto: UpdateScheduleTeacherDto,
  ): Promise<ScheduleTeacher> {
    const scheduleTeacher = await this.ensureRecordExists(id);

    const updateData: UpdateScheduleTeacherDto = {};

    if (updateScheduleTeacherDto.schedule_id !== undefined) {
      updateData.schedule_id = updateScheduleTeacherDto.schedule_id;
    }

    if (updateScheduleTeacherDto.teacher_id !== undefined) {
      updateData.teacher_id = updateScheduleTeacherDto.teacher_id;
    }

    await scheduleTeacher.update(updateData);
    return scheduleTeacher.get() as ScheduleTeacher;
  }

  async remove(id: number) {
    const scheduleTeacher = await this.ensureRecordExists(id);
    await scheduleTeacher.destroy();
    return scheduleTeacher;
  }

  private async ensureRecordExists(id: number): Promise<ScheduleTeacher> {
    const scheduleTeacher = await this.scheduleTeacherModel.findByPk(id);

    if (!scheduleTeacher) {
      throw new NotFoundException(
        'Association between teacher and schedule not found',
      );
    }

    return scheduleTeacher;
  }
}
