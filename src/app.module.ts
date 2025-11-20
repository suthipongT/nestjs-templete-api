// นำ Module decorator สำหรับประกาศโมดูลหลักของ Nest
import { Module } from '@nestjs/common';
// นำ APP_GUARD เพื่อตั้งค่า global guard (ใช้ throttling)
import { APP_GUARD } from '@nestjs/core';
// นำ ConfigModule/ConfigService สำหรับโหลดค่า env และ inject ใช้งาน
import { ConfigModule, ConfigService } from '@nestjs/config';
// นำ ThrottlerGuard/ThrottlerModule สำหรับ rate limiting
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
// นำ TypeOrmModule สำหรับเชื่อมต่อฐานข้อมูล
import { TypeOrmModule } from '@nestjs/typeorm';
// นำคอนโทรลเลอร์ของแอป (health, csrf-token)
import { AppController } from './app.controller';

@Module({
  imports: [
    // โหลดไฟล์ .env ตาม NODE_ENV และทำให้ ConfigService ใช้งานได้ทุกที่
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev',
    }),
    // ตั้งค่า throttling ด้วยค่า ttl/limit จาก .env
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('RATE_LIMIT_TTL', 60),
          limit: config.get<number>('RATE_LIMIT_LIMIT', 100),
        },
      ],
    }),
    // ตั้งค่าการเชื่อมต่อฐานข้อมูล MariaDB/MySQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', 'we2pos'),
        autoLoadEntities: true, // โหลด entity อัตโนมัติจากทุกโมดูล
        synchronize: false, // ปิด sync schema ใน production เพื่อความปลอดภัย
      }),
    }),
  ],
  // ลงทะเบียนคอนโทรลเลอร์หลัก
  controllers: [AppController],
  providers: [
    {
      // ตั้งให้ ThrottlerGuard เป็น global guard สำหรับทุกเส้นทาง
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
