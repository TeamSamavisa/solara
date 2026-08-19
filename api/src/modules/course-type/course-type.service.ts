import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseTypeDto } from './dto/create-course-type.dto';
import { UpdateCourseTypeDto } from './dto/update-course-type.dto';
import { CourseType } from './entities/course-type.entity';
import { InjectModel } from '@nestjs/sequelize';
import { GetCourseTypesQueryDto } from './dto/get-course-types.dto';
import { buildWhere } from 'src/utils/build-where';
import { PaginatedResponse } from 'src/utils/types/paginated-response';

@Injectable()
export class CourseTypeService {
  constructor(
    @InjectModel(CourseType)
    private readonly courseTypeModel: typeof CourseType,
  ) {}

  async create(createCourseTypeDto: CreateCourseTypeDto): Promise<CourseType> {
    const courseTypeData = {
      name: createCourseTypeDto.name,
    };

    const courseType = await this.courseTypeModel.create(courseTypeData);
    return courseType.get() as CourseType;
  }

  async list(
    query: GetCourseTypesQueryDto,
  ): Promise<PaginatedResponse<CourseType>> {
    const { limit, offset, page, ...filter } = query;

    const result = await this.courseTypeModel.findAndCountAll({
      where: buildWhere(filter),
      limit,
      offset,
      order: [['name', 'ASC']],
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
    const courseType = await this.courseTypeModel.findByPk(id, {
      raw: true,
    });
    if (!courseType) {
      throw new NotFoundException('CourseType not found');
    }
    return courseType;
  }

  async update(
    id: number,
    updateCourseTypeDto: UpdateCourseTypeDto,
  ): Promise<CourseType> {
    const courseType = await this.ensureRecordExists(id);

    const updateData: UpdateCourseTypeDto = {};

    if (updateCourseTypeDto.name !== undefined) {
      updateData.name = updateCourseTypeDto.name;
    }

    await courseType.update(updateData);
    return courseType.get() as CourseType;
  }

  async remove(id: number) {
    const courseType = await this.ensureRecordExists(id);
    await courseType.destroy();
    return courseType;
  }

  private async ensureRecordExists(id: number): Promise<CourseType> {
    const courseType = await this.courseTypeModel.findByPk(id);
    if (!courseType) {
      throw new NotFoundException('CourseType not found');
    }
    return courseType;
  }
}
