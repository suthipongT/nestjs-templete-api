import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import type { UserEntity } from '../../modules/user/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';

export async function issueVerifyEmailToken(
  user: UserEntity,
  jwtService: JwtService,
  configService: ConfigService,
): Promise<string> {
  const secret =
    configService.get<string>('JWT_VERIFY_EMAIL_SECRET') ??
    configService.get<string>('JWT_SECRET');
  const expiresIn = configService.get<string>(
    'JWT_VERIFY_EMAIL_EXPIRES_IN',
    '1h',
  ) as StringValue;
  return jwtService.signAsync(
    {
      sub: user.id,
      email: user.email,
      purpose: 'verify_email',
    },
    { secret, expiresIn },
  );
}

export async function verifyEmailToken(
  token: string,
  jwtService: JwtService,
  configService: ConfigService,
): Promise<{ sub: number; email: string }> {
  const secret =
    configService.get<string>('JWT_VERIFY_EMAIL_SECRET') ??
    configService.get<string>('JWT_SECRET');
  let payload:
    | {
        sub?: number;
        email?: string;
        purpose?: string;
      }
    | undefined;
  try {
    payload = await jwtService.verifyAsync(token, { secret });
  } catch {
    throw new UnauthorizedException('Invalid verify token');
  }
  if (
    !payload?.sub ||
    typeof payload.sub !== 'number' ||
    payload.purpose !== 'verify_email' ||
    typeof payload.email !== 'string'
  ) {
    throw new UnauthorizedException('Invalid verify token');
  }
  return { sub: payload.sub, email: payload.email };
}
