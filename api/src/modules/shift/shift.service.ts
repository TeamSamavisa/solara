import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { Shift } from './entities/shift.entity';
import { InjectModel } from '@nestjs/sequelize';
import { GetShiftsQueryDto } from './dto/get-shifts.dto';
import { buildWhere } from 'src/utils/build-where';
import { PaginatedResponse } from 'src/utils/types/paginated-response';

@Injectable()
export class ShiftService {
  constructor(
    @InjectModel(Shift)
    private readonly shiftModel: typeof Shift,
  ) {}

  async create(createShiftDto: CreateShiftDto): Promise<Shift> {
    const shiftData = {
      name: createShiftDto.name,
    };

    const shift = await this.shiftModel.create(shiftData);
    return shift.get() as Shift;
  }

  async list(query: GetShiftsQueryDto): Promise<PaginatedResponse<Shift>> {
    const { limit, offset, page, ...filter } = query;

    const result = await this.shiftModel.findAndCountAll({
      where: buildWhere(filter),
      limit,
      offset,
      order: [['createdAt', 'DESC']],
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
    const shift = await this.shiftModel.findByPk(id, {
      raw: true,
    });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    return shift;
  }

  async update(id: number, updateShiftDto: UpdateShiftDto): Promise<Shift> {
    const shift = await this.ensureRecordExists(id);

    const updateData: UpdateShiftDto = {};

    if (updateShiftDto.name !== undefined) {
      updateData.name = updateShiftDto.name;
    }

    await shift.update(updateData);
    return shift.get() as Shift;
  }

  async remove(id: number) {
    const shift = await this.ensureRecordExists(id);
    await shift.destroy();
    return shift;
  }

  private async ensureRecordExists(id: number): Promise<Shift> {
    const shift = await this.shiftModel.findByPk(id);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    return shift;
  }
}
