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
