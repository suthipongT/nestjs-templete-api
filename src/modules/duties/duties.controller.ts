import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { buildPagination } from '../../common/utils/pagination.util';
import { DutiesService } from './duties.service';
import { CreateDutyDto, UpdateDutyDto } from './dto/duty.dto';
import { Request } from 'express';

@Controller('duties')
@ApiTags('Duty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class DutiesController {
  constructor(private readonly dutiesService: DutiesService) {}

  // GET /duties ดึงรายการหน้าที่
  @Get()
  @ApiOperation({ summary: 'รายการหน้าที่ (isActive=Y) พร้อม pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'หน้าที่ต้องการ (เริ่มที่ 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    description: 'จำนวนรายการต่อหน้า (เริ่มต้น 20)',
  })
  @ApiOkResponse({ description: 'สำเร็จ' })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const { page: pageNum, limit: take } = buildPagination(page, limit, {
      defaultLimit: 20,
      maxLimit: 100,
    });

    return this.dutiesService.findAll(pageNum, take);
  }

  // POST /duties เพิ่มหน้าที่
  @Post()
  @ApiOperation({ summary: 'เพิ่มหน้าที่' })
  @ApiCreatedResponse({
    description: 'เพิ่มหน้าที่สำเร็จ',
    schema: {
      example: {
        message: 'Successfully',
        results: {
          duties: {
            id: 1,
            duty_name: 'Admin',
            isActive: 'Y',
            tokenVersion: 0,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'ข้อมูลไม่ถูกต้อง' })
  createDuty(
    @Body() dto: CreateDutyDto,
    @Req() req: Request & { user?: { userId: number } },
  ) {
    const userId = req.user?.userId;
    return this.dutiesService.create(dto, userId);
  }

  // GET by id /duties/:id
  @Get(':id')
  @ApiOperation({ summary: 'ดูข้อมูลหน้าที่ตาม id' })
  @ApiOkResponse({ description: 'สำเร็จ' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const duty = await this.dutiesService.findOne(id);
    return { message: 'Get duty successfully', results: duty };
  }

  // PUT by id /duties/:id
  @Put(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลหน้าที่ตาม id' })
  @ApiOkResponse({ description: 'แก้ไขข้อมูลหน้าที่สำเร็จ' })
  async updateDuty(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDutyDto,
    @Req() req: Request & { user?: { userId?: number; sub?: number } },
  ) {
    // ดึงรหัสผู้ใช้ที่ล็อกอิน (รองรับทั้ง userId หรือ sub)
    const actorId = req.user?.userId ?? req.user?.sub ?? undefined;
    const updated = await this.dutiesService.update(
      id,
      dto,
      actorId,
    );
    return { message: 'Update duty successfully', results: updated };
  }


  // DELETE by id /duties/:id
  @Delete(':id')
  @ApiOperation({ summary: 'ลบผู้หน้าที่ตาม id' })
  @ApiOkResponse({ description: 'ลบสำเร็จ' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user?: { userId?: number; sub?: number } },
  ) {
    const actorId = req.user?.userId ?? req.user?.sub ?? undefined;
    const removed = await this.dutiesService.delete(id, actorId);

    return { message: 'Delete duty successfully', results: removed };
  }
}
