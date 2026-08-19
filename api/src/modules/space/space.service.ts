import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Space } from './entities/space.entity';
import { GetSpacesQueryDto } from './dto/get-spaces.dto';
import { buildWhere } from 'src/utils/build-where';
import { PaginatedResponse } from 'src/utils/types/paginated-response';

@Injectable()
export class SpaceService {
  constructor(
    @InjectModel(Space)
    private readonly spaceModel: typeof Space,
  ) {}

  async create(createSpaceDto: CreateSpaceDto): Promise<Space> {
    const spaceData = {
      name: createSpaceDto.name,
      floor: createSpaceDto.floor,
      capacity: createSpaceDto.capacity,
      blocked: createSpaceDto.blocked,
      space_type_id: createSpaceDto.space_type_id,
    };

    const space = await this.spaceModel.create(spaceData);
    return space.get() as Space;
  }

  async list(query: GetSpacesQueryDto): Promise<PaginatedResponse<Space>> {
    const { limit, offset, page, ...filter } = query;

    const result = await this.spaceModel.findAndCountAll({
      where: buildWhere(filter),
      limit,
      offset,
      order: [['name', 'ASC']],
      include: ['spaceType'],
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

  async getById(id: number): Promise<Space> {
    const space = await this.spaceModel.findByPk(id, {
      include: ['spaceType'],
      raw: true,
    });

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    return space.toJSON();
  }

  async update(id: number, updateSpaceDto: UpdateSpaceDto): Promise<Space> {
    const space = await this.ensureRecordExists(id);

    const updateData: UpdateSpaceDto = {};

    if (updateSpaceDto.name !== undefined) {
      updateData.name = updateSpaceDto.name;
    }

    if (updateSpaceDto.floor !== undefined) {
      updateData.floor = updateSpaceDto.floor;
    }

    if (updateSpaceDto.capacity !== undefined) {
      updateData.capacity = updateSpaceDto.capacity;
    }

    if (updateSpaceDto.blocked !== undefined) {
      updateData.blocked = updateSpaceDto.blocked;
    }

    if (updateSpaceDto.space_type_id !== undefined) {
      updateData.space_type_id = updateSpaceDto.space_type_id;
    }

    await space.update(updateData);
    return space.get() as Space;
  }

  async remove(id: number) {
    const space = await this.ensureRecordExists(id);
    await space.destroy();
    return space;
  }

  private async ensureRecordExists(id: number): Promise<Space> {
    const space = await this.spaceModel.findByPk(id);

    if (!space) {
      throw new NotFoundException('Space not found');
    }

    return space;
  }
}
