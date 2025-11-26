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
        const tagOrder = ['Authen', 'User', 'Duty'];
        const aOrder = tagOrder.indexOf(a);
        const bOrder = tagOrder.indexOf(b);
        const safeA = aOrder === -1 ? Number.MAX_SAFE_INTEGER : aOrder;
        const safeB = bOrder === -1 ? Number.MAX_SAFE_INTEGER : bOrder;
        return safeA - safeB || a.localeCompare(b);
      },
      operationsSorter: (
        a: { get?: (key: string) => unknown },
        b: { get?: (key: string) => unknown },
      ) => {
        // ลำดับละเอียด (method + path) ที่ต้องการให้แสดง
        const opOrder = [
          'post /api/auth/signup',
          'post /api/auth/verify-email',
          'post /api/auth/resend-verify-email',
          'post /api/auth/login',
          'post /api/auth/forgot-password',
          'post /api/auth/reset-password',
          'post /api/auth/refresh-token',
          'post /api/auth/logout',

          'get /api/user',
          'post /api/user',
          'get /api/user/{id}',
          'put /api/user/{id}',
          'post /api/user/reset-password/{id}',
          'delete /api/user/{id}',

          'get /api/duties',
          'post /api/duties',
          'get /api/duties/{id}',
        ];

        const extract = (
          op: { get?: (key: string) => unknown },
          key: 'path' | 'method',
        ): string => {
          if (op && typeof op === 'object' && typeof op.get === 'function') {
            const val = op.get(key);
            if (typeof val === 'string') return val;
          }
          return '';
        };

        const aPath = extract(a, 'path');
        const bPath = extract(b, 'path');
        const aMethod = extract(a, 'method');
        const bMethod = extract(b, 'method');

        const aKey = `${aMethod.toLowerCase()} ${aPath}`;
        const bKey = `${bMethod.toLowerCase()} ${bPath}`;
        const aIdx = opOrder.indexOf(aKey);
        const bIdx = opOrder.indexOf(bKey);
        const safeA = aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx;
        const safeB = bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx;
        if (safeA !== safeB) {
          return safeA - safeB;
        }
        // fallback ถ้าไม่พบในลิสต์ ให้เรียงตาม path > method
        if (aPath !== bPath) return aPath.localeCompare(bPath);
        return aMethod.localeCompare(bMethod);
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
