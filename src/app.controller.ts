// import decorator และ exception ที่ใช้ในคอนโทรลเลอร์
import {
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
// type Request จาก express เพื่อใช้กับ csrfToken
import type { Request } from 'express';

// กำหนดว่าคลาสนี้เป็นคอนโทรลเลอร์ระดับ root (prefix ถูกตั้งใน main.ts)
@ApiExcludeController()
@Controller()
export class AppController {
  // เส้นทาง GET /health สำหรับเช็กสถานะระบบ
  @Get('health')
  @HttpCode(200)
  getHealth() {
    return {
      // ข้อความสำหรับ response wrapper
      message: 'Health check successfully',
      // รายงานสถานะปกติ
      results: {
        status: 'ok',
        // เวลาที่โปรเซสทำงานอยู่ (sec)
        uptime: process.uptime(),
        // เวลาปัจจุบันในรูป ISO string
        timestamp: new Date().toISOString(),
      },
    };
  }

  // เส้นทาง GET /csrf-token ส่ง token ให้ client ใช้ใน header X-CSRF-TOKEN
  @Get('csrf-token')
  @HttpCode(200)
  getCsrfToken(
    @Req()
    req: Request & {
      csrfToken?: () => string;
    },
  ) {
    // เรียก method ที่ csurf เพิ่มเข้ามาเพื่อดึง token
    const token = req.csrfToken?.();
    // ถ้าไม่มี token ให้ throw error
    if (!token) {
      throw new InternalServerErrorException('CSRF token unavailable');
    }
    // ส่ง token กลับใน response body
    return {
      message: 'Get CSRF token successfully',
      results: { csrfToken: token },
    };
  }
}
