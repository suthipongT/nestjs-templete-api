import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly configService: ConfigService,
  ) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.usersRepo.findAndCount({
      where: { isActive: 'Y' },
      order: { id: 'ASC' },
      skip,
      take: limit,
    });
    return {
      items: items.map((u) => this.toSafeUser(u)),
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async findOne(id: number) {
    const user = await this.usersRepo.findOne({ where: { id, isActive: 'Y' } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toSafeUser(user);
  }

  async create(dto: CreateUserDto) {
    const hashed = await this.hashValue(dto.password);
    const user = this.usersRepo.create({
      email: dto.email.toLowerCase().trim(),
      hashPassword: hashed,
      firstname: dto.firstname,
      lastname: dto.lastname,
      nickname: dto.nickname ?? null,
      birthday: dto.birthday ?? null,
      isActive: 'Y',
    });
    const saved = await this.usersRepo.save(user);
    return this.toSafeUser(saved);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.usersRepo.findOne({ where: { id, isActive: 'Y' } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (dto.email) user.email = dto.email.toLowerCase().trim();
    if (dto.firstname) user.firstname = dto.firstname;
    if (dto.lastname) user.lastname = dto.lastname;
    if (dto.nickname !== undefined) user.nickname = dto.nickname ?? null;
    if (dto.birthday !== undefined) user.birthday = dto.birthday ?? null;
    if (dto.password) {
      user.hashPassword = await this.hashValue(dto.password);
      user.tokenVersion += 1;
      user.refreshToken = null;
    }
    const saved = await this.usersRepo.save(user);
    return this.toSafeUser(saved);
  }

  async softDelete(id: number) {
    const user = await this.usersRepo.findOne({ where: { id, isActive: 'Y' } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isActive = 'N';
    user.refreshToken = null;
    user.tokenVersion += 1;
    const saved = await this.usersRepo.save(user);
    return this.toSafeUser(saved);
  }

  private async hashValue(value: string): Promise<string> {
    const saltRounds = Number(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'),
    );
    return bcrypt.hash(value, saltRounds);
  }

  private toSafeUser(user: UserEntity) {
    const {
      hashPassword,
      refreshToken,
      passwordResetToken,
      passwordResetExpiresAt,
      ...rest
    } = user;
    void hashPassword;
    void refreshToken;
    void passwordResetToken;
    void passwordResetExpiresAt;
    return rest;
  }
}
