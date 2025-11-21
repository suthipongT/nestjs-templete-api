// โมดูลหลักของ auth ใช้จัดการ dependency ทั้งหมด
import { Module } from '@nestjs/common';
// โหลดค่า env ผ่าน ConfigService
import { ConfigModule, ConfigService } from '@nestjs/config';
// โมดูล JWT สำหรับออก/ตรวจ token
import { JwtModule } from '@nestjs/jwt';
// PassportModule ใช้ร่วมกับกลยุทธ์ jwt
import { PassportModule } from '@nestjs/passport';
// เชื่อม TypeORM กับ entity User
import { TypeOrmModule } from '@nestjs/typeorm';
// type helper ของ JwtModule
import type { JwtModuleOptions } from '@nestjs/jwt';
// type ของ expiresIn รองรับรูปแบบ "1h"
import type { StringValue } from 'ms';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { User } from './entities/user.entity';

@Module({
  imports: [
    ConfigModule, // ทำให้ ConfigService ใช้งานได้ในโมดูลนี้
    TypeOrmModule.forFeature([User]), // เปิด repository ของ User entity
    PassportModule.register({ defaultStrategy: 'jwt' }), // ตั้งค่า default strategy เป็น jwt
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => {
        // ดึง secret สำหรับเซ็น JWT ถ้าไม่มีให้หยุดบูต
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is required');
        }
        // อนุญาตระบุ expiresIn เป็น string (เช่น "1h")
        const expiresIn = config.get<string>(
          'JWT_EXPIRES_IN',
          '1h',
        ) as StringValue;
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule, TypeOrmModule],
})
export class AuthModule {}
