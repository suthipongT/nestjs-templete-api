import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DutiesEntity } from './entities/duties.entuty';
import { CreateDutyDto, UpdateDutyDto } from './dto/duty.dto';
import { buildPagination } from '../../common/utils/pagination.util';
import type { Request } from 'express';

@Injectable()
export class DutiesService {
  constructor(
    @InjectRepository(DutiesEntity)
    private readonly dutiesRepo: Repository<DutiesEntity>,
  ) {}

  async findAll(page = 1, limit = 20) {
    const {
      page: pageNum,
      take,
      skip,
    } = buildPagination(page, limit, {
      defaultLimit: 20,
      maxLimit: 100,
    });

    const [items, total] = await this.dutiesRepo.findAndCount({
      where: { isActive: 'Y' },
      order: { id: 'ASC' },
      skip,
      take,
    });

    return {
      items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: take,
        totalPages: Math.ceil(total / take),
        currentPage: pageNum,
      },
    };
  }

  async create(dto: CreateDutyDto, actorId?: number) {
    let duty_name = dto.dutyName.trim();
    const existing = await this.dutiesRepo.findOne({
      where: { dutyName: duty_name },
    });
    if (existing) {
      throw new ConflictException('Duty name already exists');
    }

    const duty = this.dutiesRepo.create({
      dutyName: duty_name,
      isActive: 'Y',
      createdBy: actorId ?? null,
      updatedBy: actorId ?? null,
    });

    const saved = await this.dutiesRepo.save(duty);

    return {
      message: 'Created successfully',
      results: {
        duty: saved,
      },
    };
  }

  async findOne(id: number) {
    const duty = await this.dutiesRepo.findOne({
      where: { id, isActive: 'Y' },
    });
    if (!duty) {
      throw new NotFoundException('Duty not found');
    }
    return duty;
  }

  async update(id: number, dto: UpdateDutyDto, actorId?: number) {
    const duty = await this.dutiesRepo.findOne({
      where: { id, isActive: 'Y' },
    });
    if (!duty) {
      throw new NotFoundException('Duty not found');
    }

    const dutyName = dto.dutyName.trim();
    const duplicate = await this.dutiesRepo.findOne({
      where: { dutyName },
    });
    if (duplicate && duplicate.id !== id) {
      throw new ConflictException('Duty name already exists');
    }

    duty.dutyName = dutyName;
    duty.updatedBy = actorId ?? duty.updatedBy ?? null;

    const saved = await this.dutiesRepo.save(duty);
    return saved;
  }

  async delete(id: number, actorId?: number) {
    const duty = await this.dutiesRepo.findOne({
      where: { id, isActive: 'Y' },
    });
    if (!duty) {
      throw new NotFoundException('Duty not found');
    }
    duty.isActive = 'N';
    duty.updatedBy = actorId ?? null;
    const saved = await this.dutiesRepo.save(duty);

    return saved;
  }
}
