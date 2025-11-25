import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { ConfigService } from '@nestjs/config';

type SwaggerRequest = {
  headers?: Record<string, string>;
  [key: string]: unknown;
};

export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
) {
  const enableSwagger =
    configService.get<string>('ENABLE_SWAGGER', 'true') === 'true';
  if (!enableSwagger) return;

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
      // ซ่อน section Schemas จาก sidebar
      defaultModelsExpandDepth: -1,
      // ให้ tag ทั้งหมดหุบเมื่อเปิดหน้า (ไม่ต้อง scroll ยาว)
      docExpansion: 'none',
      // จัดเรียงแท็กและ endpoint ตามลำดับที่กำหนด
      tagsSorter: (a: string, b: string) => {
        const tagOrder = ['Auth'];
        const aOrder = tagOrder.indexOf(a);
        const bOrder = tagOrder.indexOf(b);
        const safeA = aOrder === -1 ? Number.MAX_SAFE_INTEGER : aOrder;
        const safeB = bOrder === -1 ? Number.MAX_SAFE_INTEGER : bOrder;
        return safeA - safeB || a.localeCompare(b);
      },
      operationsSorter: (a: any, b: any) => {
        // ใช้ path เป็นตัวกำหนดลำดับ endpoint แบบเสถียร (ไม่พึ่ง operationId)
        const pathOrder: Record<string, number> = {
          '/api/auth/signup': 1,
          '/api/auth/verify-email': 2,
          '/api/auth/resend-verify-email': 3,
          '/api/auth/login': 4,
          '/api/auth/forgot-password': 5,
          '/api/auth/refresh-token': 6,
          '/api/auth/reset-password': 7,
          '/api/auth/logout': 8,
          '/api/user': 20,
          '/api/user/{id}': 21,
          '/auth/signup': 1,
          '/auth/verify-email': 2,
          '/auth/resend-verify-email': 3,
          '/auth/login': 4,
          '/auth/forgot-password': 5,
          '/auth/refresh-token': 6,
          '/auth/reset-password': 7,
          '/auth/logout': 8,
          '/user': 20,
          '/user/{id}': 21,
        };
        // ดึง operationId จากข้อมูลที่ Swagger UI ส่งมา (รองรับทั้ง getter และ property ปกติ)
        const opId = (item: any): string => {
          const getVal = (val: any, key: string) =>
            typeof val?.get === 'function' ? val.get(key) : undefined;
          const fromGetter = getVal(item, 'operationId');
          if (typeof fromGetter === 'string') return fromGetter;
          const opInner = getVal(item, 'operation');
          const fromInnerGetter =
            opInner && typeof opInner.get === 'function'
              ? opInner.get('operationId')
              : undefined;
          if (typeof fromInnerGetter === 'string') return fromInnerGetter;
          if (typeof item?.operationId === 'string') return item.operationId;
          if (typeof item?.operation?.operationId === 'string') {
            return item.operation.operationId;
          }
          return '';
        };
        // ดึง path สำหรับ fallback
        const opPath = (item: any): string => {
          const getVal = (val: any, key: string) =>
            typeof val?.get === 'function' ? val.get(key) : undefined;
          const fromGetter = getVal(item, 'path');
          if (typeof fromGetter === 'string') return fromGetter;
          if (typeof item?.path === 'string') return item.path;
          if (typeof item?.operation?.path === 'string')
            return item.operation.path;
          return '';
        };
        const rank = (item: any): number => {
          const path = opPath(item);
          if (typeof pathOrder[path] === 'number') return pathOrder[path];
          return Number.MAX_SAFE_INTEGER;
        };

        const aRank = rank(a);
        const bRank = rank(b);
        if (aRank !== bRank) {
          return aRank - bRank;
        }
        const aPath = opPath(a);
        const bPath = opPath(b);
        return aPath.localeCompare(bPath);
      },
      // แนบ CSRF token จากคุกกี้ไปที่ header อัตโนมัติเมื่อลองยิงผ่าน Swagger UI
      requestInterceptor: (req: SwaggerRequest): SwaggerRequest => {
        try {
          const headers: Record<string, string> = req.headers ?? {};
          if (
            typeof window !== 'undefined' &&
            typeof window.document !== 'undefined'
          ) {
            const tokenCookie = window.document.cookie
              ?.split(';')
              .map((c) => c.trim())
              .find((c) => c.startsWith('XSRF-TOKEN='));
            if (tokenCookie) {
              const token = decodeURIComponent(tokenCookie.split('=')[1] ?? '');
              if (token) {
                headers['X-CSRF-Token'] = token;
              }
            }
          }
          return { ...req, headers };
        } catch {
          return req;
        }
      },
    },
    // ซ่อนการแสดงเวอร์ชัน OAS/OpenAPI ในหัวเอกสาร
    customCss: `
      .swagger-ui .info .title small.version-stamp {
        display: none !important;
      }
    `,
    useGlobalPrefix: false, // ให้ docs อยู่ที่ /docs ไม่ติด prefix
  });
}
