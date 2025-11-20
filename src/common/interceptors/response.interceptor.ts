import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { StandardSuccessResponse } from '../types/response.type';

@Injectable()
export class StandardResponseInterceptor<T>
  implements NestInterceptor<T, StandardSuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardSuccessResponse<T>> {
    // ทำงานต่อเมื่อเป็นคำขอ HTTP เท่านั้น
    if (context.getType() !== 'http') {
      // บริการประเภทอื่น (เช่น RPC/WebSocket) ส่งต่อไปโดยแปลง type ให้สอดคล้อง
      return next.handle() as Observable<StandardSuccessResponse<T>>;
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
          return data as StandardSuccessResponse<T>;
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
}
