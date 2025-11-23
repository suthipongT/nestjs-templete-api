// กลยุทธ์ JWT สำหรับตรวจสอบ token จาก Authorization header
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { JwtFromRequestFunction, StrategyOptions } from 'passport-jwt';
import type { Request } from 'express';

export interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    // ดึง secret มาใช้ verify token
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }

    const jwtFromRequest: JwtFromRequestFunction = (req: Request) => {
      const header = req.headers?.authorization;
      if (typeof header !== 'string') return null;
      const [scheme, token] = header.split(' ');
      if (scheme?.toLowerCase() !== 'bearer') return null;
      return token ?? null;
    };

    const strategyOptions: StrategyOptions = {
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: secret,
    };
    // PassportStrategy constructor พิมพ์เป็น any ใน type definition ของ Nest แต่ใช้งานได้ปลอดภัย

    super(strategyOptions);
  }

  // คืนค่า user object ที่จะถูกแนบใน req.user
  validate(payload: JwtPayload) {
    if (!payload?.sub || !payload?.email) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return { userId: payload.sub, email: payload.email };
  }
}
