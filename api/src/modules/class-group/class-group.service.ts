import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClassGroupDto } from './dto/create-class-group.dto';
import { UpdateClassGroupDto } from './dto/update-class-group.dto';
import { ClassGroup } from './entities/class-group.entity';
import { InjectModel } from '@nestjs/sequelize';
import { GetClassGroupsQueryDto } from './dto/get-class-groups.dto';
import { buildWhere } from 'src/utils/build-where';
import { PaginatedResponse } from 'src/utils/types/paginated-response';

@Injectable()
export class ClassGroupService {
  constructor(
    @InjectModel(ClassGroup)
    private readonly classGroupModel: typeof ClassGroup,
  ) {}

  async create(createClassGroupDto: CreateClassGroupDto): Promise<ClassGroup> {
    const classGroupData = {
      name: createClassGroupDto.name,
      semester: createClassGroupDto.semester,
      module: createClassGroupDto.module,
      student_count: createClassGroupDto.student_count,
      shift_id: createClassGroupDto.shift_id,
      course_id: createClassGroupDto.course_id,
    };

    const classGroup = await this.classGroupModel.create(classGroupData);
    return classGroup.get() as ClassGroup;
  }

  async list(
    query: GetClassGroupsQueryDto,
  ): Promise<PaginatedResponse<ClassGroup>> {
    const { limit, offset, page, ...filter } = query;

    const result = await this.classGroupModel.findAndCountAll({
      where: buildWhere(filter),
      limit,
      offset,
      order: [['name', 'ASC']],
      include: ['shift', 'course'],
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
    const classGroup = await this.classGroupModel.findByPk(id, {
      include: ['shift', 'course'],
      raw: true,
    });

    if (!classGroup) {
      throw new NotFoundException('Class group not found');
    }

    return classGroup;
  }

  async update(
    id: number,
    updateClassGroupDto: UpdateClassGroupDto,
  ): Promise<ClassGroup> {
    const classGroup = await this.ensureRecordExists(id);

    const updateData: UpdateClassGroupDto = {};

    if (updateClassGroupDto.name !== undefined) {
      updateData.name = updateClassGroupDto.name;
    }

    if (updateClassGroupDto.semester !== undefined) {
      updateData.semester = updateClassGroupDto.semester;
    }

    if (updateClassGroupDto.module !== undefined) {
      updateData.module = updateClassGroupDto.module;
    }

    if (updateClassGroupDto.student_count !== undefined) {
      updateData.student_count = updateClassGroupDto.student_count;
    }

    if (updateClassGroupDto.shift_id !== undefined) {
      updateData.shift_id = updateClassGroupDto.shift_id;
    }

    if (updateClassGroupDto.course_id !== undefined) {
      updateData.course_id = updateClassGroupDto.course_id;
    }

    await classGroup.update(updateData);
    return classGroup.get() as ClassGroup;
  }

  async remove(id: number) {
    const classGroup = await this.ensureRecordExists(id);
    await classGroup.destroy();
    return classGroup;
  }

  private async ensureRecordExists(id: number): Promise<ClassGroup> {
    const classGroup = await this.classGroupModel.findByPk(id);

    if (!classGroup) {
      throw new NotFoundException('Class group not found');
    }

    return classGroup;
  }
}
