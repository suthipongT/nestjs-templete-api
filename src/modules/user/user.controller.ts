import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'รายการผู้ใช้ (isActive=Y) พร้อม pagination' })
  @ApiOkResponse({ description: 'สำเร็จ' })
  async findAll(@Query('page') page = '1', @Query('limit') limit = '20') {
    const pageNum = Math.max(1, Number(page) || 1);
    const take = Math.max(1, Number(limit) || 20);
    return this.userService.findAll(pageNum, take);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'สร้างผู้ใช้ใหม่' })
  @ApiOkResponse({ description: 'สร้างสำเร็จ' })
  async create(@Body() dto: CreateUserDto) {
    const created = await this.userService.create(dto);
    return { message: 'Create user successfully', results: created };
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูข้อมูลผู้ใช้ตาม id' })
  @ApiOkResponse({ description: 'สำเร็จ' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findOne(id);
    return { message: 'Get user successfully', results: user };
  }

  @Put(':id')
  @ApiOperation({ summary: 'อัปเดตข้อมูลผู้ใช้' })
  @ApiOkResponse({ description: 'อัปเดตสำเร็จ' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    const updated = await this.userService.update(id, dto);
    return { message: 'Update user successfully', results: updated };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบผู้ใช้แบบ soft delete (isActive=N)' })
  @ApiOkResponse({ description: 'ลบสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const removed = await this.userService.softDelete(id);
    return { message: 'Delete user successfully', results: removed };
  }
}
