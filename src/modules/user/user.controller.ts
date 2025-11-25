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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import type { Express } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UserService } from './user.service';

@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'รายการผู้ใช้ (isActive=Y) พร้อม pagination' })
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
    const pageNum = Math.max(1, page ?? 1);
    const take = Math.max(1, limit ?? 20);
    return this.userService.findAll(pageNum, take);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'สร้างผู้ใช้ใหม่ (แนบไฟล์ profile_img ได้ ไม่บังคับ)',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
        firstname: { type: 'string' },
        lastname: { type: 'string' },
        nickname: { type: 'string' },
        birthday: { type: 'string', format: 'date' },
        profileImg: { type: 'string', description: 'optional path/URL' },
        profile_img: {
          type: 'string',
          format: 'binary',
          description: 'ไฟล์รูปโปรไฟล์ (ไม่บังคับ)',
        },
      },
      required: ['email', 'password', 'firstname', 'lastname'],
    },
  })
  @UseInterceptors(
    FileInterceptor('profile_img', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(
            process.cwd(),
            'uploads',
            'user',
            'profile',
          );
          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const base = path.basename(file.originalname, ext);
          const suffix = randomBytes(6).toString('hex');
          const safeName = `${base}-${Date.now()}-${suffix}${ext}`;
          cb(null, safeName);
        },
      }),
    }),
  )
  @ApiOperation({ summary: 'สร้างผู้ใช้ใหม่' })
  @ApiOkResponse({ description: 'สร้างสำเร็จ' })
  async create(
    @Body() dto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const created = await this.userService.create(
      dto,
      file ? `/uploads/user/profile/${file.filename}` : undefined,
    );
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'อัปเดตข้อมูลผู้ใช้ (แนบไฟล์ profile_img ได้ ไม่บังคับ)',
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
        firstname: { type: 'string' },
        lastname: { type: 'string' },
        nickname: { type: 'string' },
        birthday: { type: 'string', format: 'date' },
        profileImg: { type: 'string', description: 'optional path/URL' },
        profile_img: {
          type: 'string',
          format: 'binary',
          description: 'ไฟล์รูปโปรไฟล์ (ไม่บังคับ)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('profile_img', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(
            process.cwd(),
            'uploads',
            'user',
            'profile',
          );
          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const base = path.basename(file.originalname, ext);
          const suffix = randomBytes(6).toString('hex');
          const safeName = `${base}-${Date.now()}-${suffix}${ext}`;
          cb(null, safeName);
        },
      }),
    }),
  )
  @ApiOperation({ summary: 'อัปเดตข้อมูลผู้ใช้' })
  @ApiOkResponse({ description: 'อัปเดตสำเร็จ' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const updated = await this.userService.update(
      id,
      dto,
      file ? `/uploads/user/profile/${file.filename}` : undefined,
    );
    return { message: 'Update user successfully', results: updated };
  }

  @Post('reset-password/:id')
  @ApiOperation({ summary: 'รีเซ็ตรหัสผ่านผู้ใช้ (admin only)' })
  @ApiOkResponse({
    description: 'รีเซ็ตรหัสผ่านสำเร็จ',
    schema: {
      example: {
        message: 'Reset user password successfully',
        results: {
          id: 1,
          email: 'user@example.com',
        },
      },
    },
  })
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetUserPasswordDto,
  ) {
    const updated = await this.userService.resetPassword(id, dto);
    return { message: 'Reset user password successfully', results: updated };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบผู้ใช้แบบ soft delete (isActive=N)' })
  @ApiOkResponse({ description: 'ลบสำเร็จ' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const removed = await this.userService.softDelete(id);
    return { message: 'Delete user successfully', results: removed };
  }
}
