// ดึง ConfigService เพื่อใช้ค่า .env ผ่าน dependency injection
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// ใช้ NestFactory เพื่อ boots แอป Nest
import { NestFactory } from '@nestjs/core';
// Swagger สำหรับ API docs
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// middleware แปลงและเซ็น cookie
import cookieParser from 'cookie-parser';
// middleware ป้องกัน CSRF
import csurf from 'csurf';
// type ของ Request/Response จาก express สำหรับ static typing
import type { NextFunction, Request, Response } from 'express';
// โมดูลหลักของแอป
import { AppModule } from './app.module';

async function bootstrap() {
  // สร้างแอป Nest โดยใช้ AppModule เป็น root module
  const app = await NestFactory.create(AppModule);
  // รับ ConfigService จาก container เพื่ออ่านค่าคอนฟิก
  const configService = app.get(ConfigService);

  // เปิด validation ทั่วแอปเพื่อป้องกัน payload แปลกปลอม
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // กำหนด prefix ของ API (ค่าเริ่มต้นคือ api)
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  // ตั้ง global prefix ให้ทุก endpoint เริ่มด้วย /apiPrefix
  app.setGlobalPrefix(apiPrefix);

  // เปิด Swagger docs ถ้าตั้งค่า ENABLE_SWAGGER
  const enableSwagger =
    configService.get<string>('ENABLE_SWAGGER', 'true') === 'true';
  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('API Documentation')
      .setDescription('REST API docs')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, swaggerDoc, {
      swaggerOptions: {
        persistAuthorization: true,
        // แนบ CSRF token จากคุกกี้ไปที่ header อัตโนมัติเมื่อลองยิงผ่าน Swagger UI
        requestInterceptor: (req) => {
          if (
            typeof window !== 'undefined' &&
            typeof window.document !== 'undefined'
          ) {
            const tokenCookie = window.document.cookie
              ?.split(';')
              .map((c) => c.trim())
              .find((c) => c.startsWith('XSRF-TOKEN='));
            if (tokenCookie) {
              const token = decodeURIComponent(tokenCookie.split('=')[1]);
              req.headers['X-CSRF-Token'] = token;
            }
          }
          return req;
        },
      },
      useGlobalPrefix: false, // ให้ docs อยู่ที่ /docs ไม่ติด prefix
    });
  }

  // อ่าน CORS_ORIGINS แล้วแปลงเป็นอาร์เรย์ origin
  const allowedOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:3400')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // เปิดใช้งาน CORS พร้อม credentials สำหรับ origin ที่กำหนด
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // บังคับให้มี secret สำหรับเซ็นคุกกี้ หากไม่มีให้หยุดบูต
  const cookieSecret = configService.get<string>('COOKIE_SECRET');
  if (!cookieSecret) {
    throw new Error('COOKIE_SECRET is required');
  }
  // ถ้ามี CSRF_SECRET ให้ใช้เป็นคีย์หลักสำหรับ signed cookie (รองรับ rotation)
  const csrfSecret = configService.get<string>('CSRF_SECRET');
  const cookieSigningKeys = csrfSecret
    ? [csrfSecret, cookieSecret]
    : [cookieSecret];
  // ชื่อคุกกี้ที่เก็บ token ฝั่งเซิร์ฟเวอร์เพื่อตรวจสอบ CSRF
  const csrfCookieName = configService.get<string>(
    'CSRF_COOKIE_NAME',
    'csrf_token',
  );
  // ตรวจโหมด production เพื่อกำหนดคุณสมบัติคุกกี้
  const isProd = configService.get<string>('NODE_ENV') === 'production';
  // อ่าน flag เปิด/ปิด CSRF
  const csrfEnabled =
    configService.get<string>('ENABLE_CSRF', 'true') === 'true';

  // แทรก middleware cookie-parser เพื่อตีความคุกกี้จาก request
  app.use(cookieParser(cookieSigningKeys));

  if (csrfEnabled) {
    // สร้าง middleware csurf แบบใช้คุกกี้เก็บ secret
    const csrfMiddleware = csurf({
      cookie: {
        key: csrfCookieName,
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        signed: true,
      },
    });

    // ใช้งาน middleware csurf ในแอป
    app.use(csrfMiddleware);
    // แจก token ไปยังคุกกี้ฝั่ง client (อ่านได้ใน JavaScript) สำหรับส่งกลับมาใน header
    app.use((req: Request, res: Response, next: NextFunction) => {
      const token = (
        req as Request & { csrfToken?: () => string }
      ).csrfToken?.();
      if (token) {
        res.cookie('XSRF-TOKEN', token, {
          httpOnly: false,
          sameSite: 'lax',
          secure: isProd,
        });
      }
      next();
    });
  }

  // อ่าน host/port จาก env แล้วเริ่มฟัง
  const host = configService.get<string>('APP_HOST', '127.0.0.1');
  const port = configService.get<number>('APP_PORT', 3400);
  await app.listen(port, host);
}
// เรียกฟังก์ชันบูตเพื่อเริ่มเซิร์ฟเวอร์ พร้อม handle กรณีบูตล้มเหลว
bootstrap().catch((err) => {
  // log แล้วปิดโปรเซสด้วยรหัสผิดพลาดเพื่อให้ระบบเฝ้าระบุดักจับได้
  console.error('Bootstrap failed', err);
  process.exit(1);
});
