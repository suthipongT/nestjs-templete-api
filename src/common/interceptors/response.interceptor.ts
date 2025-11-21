import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { Readable } from 'node:stream';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { SuccessResponse } from '../types/response.type';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // ทำงานต่อเมื่อเป็นคำขอ HTTP เท่านั้น
    if (context.getType() !== 'http') {
      // บริการประเภทอื่น (เช่น RPC/WebSocket) ส่งต่อไปโดยแปลง type ให้สอดคล้อง
      return next.handle() as Observable<unknown>;
    }

    const res = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        // ถ้าคอนโทรลเลอร์สร้าง response ในรูปมาตรฐานมาแล้วให้ส่งต่อไปเลย
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'statusCode' in data
        ) {
          return data as SuccessResponse<T>;
        }

        // ไม่ห่อผลลัพธ์ในกรณีที่ต้องส่งไฟล์/สตรีม/redirect/204 หรือ header ถูกส่งแล้ว
        if (this.shouldBypassFormatting(data, res)) {
          return data;
        }

        const formatted = this.extractPayload(data);
        const statusCode = res?.statusCode ?? HttpStatus.OK;

        return {
          statusCode,
          success: true,
          message:
            formatted.message ??
            this.statusMessageFromCode(statusCode) ??
            'Success',
          results: formatted.results as T,
        };
      }),
    );
  }

  // แยก message กับผลลัพธ์ออกจากข้อมูลที่คอนโทรลเลอร์ส่งมา
  private extractPayload(data: unknown): {
    message?: string;
    results: unknown;
  } {
    if (
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      'results' in data
    ) {
      const record = data as Record<string, unknown>;
      return {
        message:
          typeof record.message === 'string' ? record.message : undefined,
        results: record.results,
      };
    }

    return { results: data };
  }

  // คืนข้อความสถานะจากรหัส HTTP ถ้าไม่มีใช้ fallback
  private statusMessageFromCode(statusCode: number): string | undefined {
    const lookup = HttpStatus as Record<string, string | number>;
    const raw = lookup[statusCode];
    return typeof raw === 'string' ? raw : undefined;
  }

  // กรณีที่ไม่ควร wrap เป็น JSON (ไฟล์/สตรีม/redirect/204 ฯลฯ)
  private shouldBypassFormatting(data: unknown, res: Response): boolean {
    if (res.headersSent) return true;
    if (
      res.statusCode === HttpStatus.NO_CONTENT ||
      res.statusCode === HttpStatus.NOT_MODIFIED
    ) {
      return true;
    }
    if (res.statusCode >= 300 && res.statusCode < 400) return true;
    if (data instanceof StreamableFile) return true;
    if (Buffer.isBuffer(data)) return true;
    if (data instanceof Readable) return true;

    const contentDisposition = res.getHeader('content-disposition');
    if (
      typeof contentDisposition === 'string' &&
      contentDisposition.toLowerCase().includes('attachment')
    ) {
      return true;
    }

    return false;
  }
}
