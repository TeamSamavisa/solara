import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSpaceTypeDto } from './dto/create-space-type.dto';
import { UpdateSpaceTypeDto } from './dto/update-space-type.dto';
import { SpaceType } from './entities/space-type.entity';
import { InjectModel } from '@nestjs/sequelize';
import { GetSpaceTypesQueryDto } from './dto/get-space-types.dto';
import { buildWhere } from 'src/utils/build-where';
import { PaginatedResponse } from 'src/utils/types/paginated-response';

@Injectable()
export class SpaceTypeService {
  constructor(
    @InjectModel(SpaceType)
    private readonly spaceTypeModel: typeof SpaceType,
  ) {}

  async create(createSpaceTypeDto: CreateSpaceTypeDto): Promise<SpaceType> {
    const spaceTypeData = {
      name: createSpaceTypeDto.name,
    };

    const spaceType = await this.spaceTypeModel.create(spaceTypeData);
    return spaceType.get() as SpaceType;
  }

  async list(
    query: GetSpaceTypesQueryDto,
  ): Promise<PaginatedResponse<SpaceType>> {
    const { limit, offset, page, ...filter } = query;

    const result = await this.spaceTypeModel.findAndCountAll({
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
    const spaceType = await this.spaceTypeModel.findByPk(id, {
      raw: true,
    });

    if (!spaceType) {
      throw new NotFoundException('SpaceType not found');
    }

    return spaceType;
  }

  async update(
    id: number,
    updateSpaceTypeDto: UpdateSpaceTypeDto,
  ): Promise<SpaceType> {
    const spaceType = await this.ensureRecordExists(id);

    const updateData: UpdateSpaceTypeDto = {};

    if (updateSpaceTypeDto.name !== undefined) {
      updateData.name = updateSpaceTypeDto.name;
    }

    await spaceType.update(updateData);
    return spaceType.get() as SpaceType;
  }

  async remove(id: number) {
    const spaceType = await this.ensureRecordExists(id);
    await spaceType.destroy();
    return spaceType;
  }

  private async ensureRecordExists(id: number): Promise<SpaceType> {
    const spaceType = await this.spaceTypeModel.findByPk(id);
    if (!spaceType) {
      throw new NotFoundException('SpaceType not found');
    }
    return spaceType;
  }
}
