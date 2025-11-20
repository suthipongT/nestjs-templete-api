import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Response } from 'express';
import type { StandardErrorResponse } from '../types/response.type';

@Injectable()
@Catch()
export class StandardExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // ทำงานเฉพาะคำขอ HTTP หากไม่ใช่ให้โยนกลับไปตามเดิม
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const payload = this.buildErrorPayload(exception);
    res.status(payload.statusCode).json(payload);
  }

  // สร้าง payload error ให้อยู่ในรูปแบบมาตรฐาน
  private buildErrorPayload(exception: unknown): StandardErrorResponse {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const resp = exception.getResponse();
      const parsed = this.parseExceptionResponse(resp);

      const message =
        parsed.message ??
        this.statusMessageFromCode(statusCode) ??
        'Request failed';

      return {
        statusCode,
        success: false,
        message,
        error: {
          field: parsed.field,
          reason: parsed.reason ?? message,
          code: parsed.code ?? this.errorCodeFromStatus(statusCode),
        },
      };
    }

    const reason =
      exception instanceof Error ? exception.message : 'Unexpected error';

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: 'Internal server error',
      error: {
        reason,
        code: 'INTERNAL_SERVER_ERROR',
      },
    };
  }

  // แยกข้อมูลที่ HttpException แนบมาจาก getResponse สำหรับ message/field/code
  private parseExceptionResponse(resBody: unknown): {
    message?: string;
    reason?: string;
    field?: string;
    code?: string;
  } {
    if (typeof resBody === 'string') {
      return { message: resBody, reason: resBody };
    }

    if (resBody && typeof resBody === 'object' && !Array.isArray(resBody)) {
      const record = resBody as Record<string, unknown>;
      const messageValue = record.message;
      const errorValue = record.error;
      const codeValue = record.code;
      const fieldValue = record.field;

      const messageFromArray = Array.isArray(messageValue)
        ? messageValue
            .map((item) => (typeof item === 'string' ? item : ''))
            .filter(Boolean)
            .join('; ')
        : undefined;
      const message =
        typeof messageValue === 'string' ? messageValue : messageFromArray;

      return {
        message,
        reason:
          message ?? (typeof errorValue === 'string' ? errorValue : undefined),
        field: typeof fieldValue === 'string' ? fieldValue : undefined,
        code: typeof codeValue === 'string' ? codeValue : undefined,
      };
    }

    return {};
  }

  // แปลง status code เป็นข้อความมาตรฐาน
  private statusMessageFromCode(statusCode: number): string | undefined {
    const lookup = HttpStatus as Record<string, string | number>;
    const raw = lookup[statusCode];
    return typeof raw === 'string' ? raw : undefined;
  }

  // สร้าง error code แบบอ่านง่ายจาก status code เพื่อใช้เป็น code fallback
  private errorCodeFromStatus(statusCode: number): string {
    const map: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'INVALID_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
      [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
    };
    return map[statusCode] ?? 'INTERNAL_SERVER_ERROR';
  }
}
