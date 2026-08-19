import bcrypt from 'bcrypt';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { GetUsersQueryDto } from './dto/get-users.dto';
import { Op } from 'sequelize';
import { buildWhere } from 'src/utils/build-where';
import { PaginatedResponse } from 'src/utils/types/paginated-response';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password_hash'>> {
    const existingEmail = await this.userModel.findOne({
      where: { email: createUserDto.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already taken');
    }

    if (createUserDto.registration) {
      const existingRegistration = await this.userModel.findOne({
        where: { email: createUserDto.registration },
      });
      if (existingRegistration) {
        throw new ConflictException('Registration already taken');
      }
    }

    // generate random password if not provided
    const password = createUserDto.password || this.generateRandomPassword();

    // transform password to password_hash
    const userData = {
      full_name: createUserDto.full_name,
      email: createUserDto.email,
      registration: createUserDto.registration,
      role: createUserDto.role || 'teacher',
      password_hash: await this.hashPassword(password),
    };

    const user = await this.userModel.create(userData);

    const result = this.sanitizeUserResponse(user);

    return result;
  }

  async list(query: GetUsersQueryDto): Promise<PaginatedResponse<User>> {
    const { limit, offset, page, ...filter } = query;

    const result = await this.userModel.findAndCountAll({
      where: buildWhere(filter),
      limit,
      offset,
      order: [['full_name', 'ASC']],
      raw: true,
    });

    // calculate pagination metadata
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

  async listTeachers(
    query: GetUsersQueryDto,
  ): Promise<PaginatedResponse<User>> {
    const { limit, offset, page, ...filter } = query;

    const whereClause = {
      ...buildWhere(filter),
      role: { [Op.in]: ['teacher', 'coordinator'] },
    };

    const result = await this.userModel.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['full_name', 'ASC']],
      raw: true,
    });

    // calculate pagination metadata
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
    const user = await this.userModel.findByPk(id, { raw: true });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getByEmail(email: string) {
    const user = await this.userModel.findOne({
      where: { email },
      attributes: ['id', 'email', 'role', 'password_hash'],
      raw: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password_hash'>> {
    const user = await this.ensureRecordExists(id);

    if (
      updateUserDto.email &&
      (await this.userModel.findOne({
        where: { email: updateUserDto.email, id: { [Op.ne]: id } },
      }))
    ) {
      throw new ConflictException('Email already taken');
    }

    if (
      updateUserDto.registration &&
      (await this.userModel.findOne({
        where: {
          registration: updateUserDto.registration,
          id: { [Op.ne]: id },
        },
      }))
    ) {
      throw new ConflictException('Registration already taken');
    }

    // transform password to password_hash if provided
    const updateData: UpdateUserDto & { password_hash?: string } = {};

    if (updateUserDto.full_name !== undefined) {
      updateData.full_name = updateUserDto.full_name;
    }

    if (updateUserDto.email) {
      updateData.email = updateUserDto.email;
    }

    if (updateUserDto.registration) {
      updateData.registration = updateUserDto.registration;
    }

    if (updateUserDto.role) {
      updateData.role = updateUserDto.role;
    }

    if (updateUserDto.password) {
      updateData.password_hash = await this.hashPassword(
        updateUserDto.password,
      );
    }

    await user.update(updateData);
    return this.sanitizeUserResponse(user);
  }

  async remove(id: number) {
    const user = await this.ensureRecordExists(id);
    await user.destroy();
    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  private async ensureRecordExists(id: number): Promise<User> {
    const user = await this.userModel.findByPk(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private generateRandomPassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private sanitizeUserResponse(user: User): Omit<User, 'password_hash'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...result } = user.get() as User;
    return result as Omit<User, 'password_hash'>;
  }
}
