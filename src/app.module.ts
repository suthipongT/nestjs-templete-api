// นำ Module decorator สำหรับประกาศโมดูลหลักของ Nest
import { Module } from '@nestjs/common';
// นำ APP_GUARD เพื่อตั้งค่า global guard (ใช้ throttling)
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
// นำ ConfigModule/ConfigService สำหรับโหลดค่า env และ inject ใช้งาน
import { ConfigModule, ConfigService } from '@nestjs/config';
// นำ ThrottlerGuard/ThrottlerModule สำหรับ rate limiting
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
// นำ TypeOrmModule สำหรับเชื่อมต่อฐานข้อมูล
import { TypeOrmModule } from '@nestjs/typeorm';
// โมดูล auth สำหรับ signup/login
import { AuthModule } from './modules/auth/auth.module';
// นำคอนโทรลเลอร์ของแอป (health, csrf-token)
import { AppController } from './app.controller';
// นำ interceptor/filter เพื่อตอบกลับในรูปแบบมาตรฐาน
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

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
          // แปลงค่า ttl/limit เป็น number เพื่อป้องกัน string หลุดไป
          ttl: Number(config.get<string>('RATE_LIMIT_TTL', '60')),
          limit: Number(config.get<string>('RATE_LIMIT_LIMIT', '100')),
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
        port: Number(config.get<string>('DB_PORT', '3306')),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_DATABASE', 'we2pos'),
        autoLoadEntities: true, // โหลด entity อัตโนมัติจากทุกโมดูล
        synchronize: false, // ปิด sync schema ใน production เพื่อความปลอดภัย
      }),
    }),
    // โมดูลจัดการ auth/signup/login และ JWT
    AuthModule,
  ],
  // ลงทะเบียนคอนโทรลเลอร์หลัก
  controllers: [AppController],
  providers: [
    {
      // ตั้งให้ ThrottlerGuard เป็น global guard สำหรับทุกเส้นทาง
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      // เปลี่ยน response ทุกอันให้เป็นรูปแบบมาตรฐาน
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      // จัดการ exception ให้ส่ง error response รูปแบบเดียวกัน
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
