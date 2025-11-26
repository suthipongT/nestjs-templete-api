import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConfigService } from '@nestjs/config';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { hashValue as bcryptHashValue } from '../../common/utils/hash.util';
import { toSafeUser as sanitizeUser } from '../../common/utils/user.util';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
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

  async create(dto: CreateUserDto, actorId?: number, profileImgPath?: string) {
    const hashed = await this.hashValue(dto.password);
    const user = this.usersRepo.create({
      email: dto.email.toLowerCase().trim(),
      hashPassword: hashed,
      firstname: dto.firstname,
      lastname: dto.lastname,
      nickname: dto.nickname ?? null,
      birthday: dto.birthday ?? null,
      isActive: 'Y',
      profileImg: profileImgPath ?? dto.profileImg ?? null,
      createdBy: actorId ?? null,
      updatedBy: actorId ?? null,
    });
    const saved = await this.usersRepo.save(user);
    return this.toSafeUser(saved);
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    actorId?: number,
    profileImgPath?: string,
  ) {
    const user = await this.usersRepo.findOne({ where: { id, isActive: 'Y' } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (dto.email) user.email = dto.email.toLowerCase().trim();
    if (dto.firstname) user.firstname = dto.firstname;
    if (dto.lastname) user.lastname = dto.lastname;
    if (dto.nickname !== undefined) user.nickname = dto.nickname ?? null;
    if (dto.birthday !== undefined) user.birthday = dto.birthday ?? null;
    if (profileImgPath) {
      user.profileImg = profileImgPath;
    } else if (dto.profileImg !== undefined) {
      user.profileImg = dto.profileImg ?? null;
    }
    if (actorId !== undefined) {
      user.updatedBy = actorId;
    }
    const saved = await this.usersRepo.save(user);
    return this.toSafeUser(saved);
  }

  async resetPassword(id: number, dto: ResetUserPasswordDto, actorId?: number) {
    const user = await this.usersRepo.findOne({ where: { id, isActive: 'Y' } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.hashPassword = await this.hashValue(dto.new_password);
    user.tokenVersion += 1;
    user.refreshToken = null;
    if (actorId !== undefined) {
      user.updatedBy = actorId;
    }
    const saved = await this.usersRepo.save(user);
    return this.toSafeUser(saved);
  }

  async softDelete(id: number, actorId?: number) {
    const user = await this.usersRepo.findOne({ where: { id, isActive: 'Y' } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isActive = 'N';
    user.refreshToken = null;
    user.tokenVersion += 1;
    user.updatedBy = actorId ?? null;
    const saved = await this.usersRepo.save(user);
    return this.toSafeUser(saved);
  }

  private async hashValue(value: string): Promise<string> {
    const saltRounds = Number(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'),
    );
    return bcryptHashValue(value, saltRounds);
  }

  private toSafeUser(user: UserEntity) {
    return sanitizeUser(user);
  }
}
