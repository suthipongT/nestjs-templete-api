import { Throttle } from '@nestjs/throttler';

// Decorator สำหรับ endpoint เสี่ยง (เช่น forgot-password/resend-verify) จำกัด 3 ครั้ง/นาที
export const SensitiveThrottle = () => Throttle({ default: { limit: 3, ttl: 60 } });
