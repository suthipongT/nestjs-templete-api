// บริการหลักของ auth จัดการ signup/login และ JWT
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import type { JwtPayload } from './jwt.strategy';
import type { StringValue } from 'ms';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto) {
    // normalize email เป็น lower-case และ trim
    const email = dto.email.toLowerCase().trim();
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    // map dto -> entity
    const hashedPassword = await this.hashPassword(dto.password);
    const user = this.usersRepo.create({
      email,
      hashPassword: hashedPassword,
      firstname: dto.firstname,
      lastname: dto.lastname,
      nickname: dto.nickname ?? null,
      birthday: dto.birthday ?? null,
      isActive: 'Y',
    });

    const saved = await this.usersRepo.save(user);
    // ส่งกลับข้อมูลผู้ใช้โดยไม่รวม field อ่อนไหว
    return {
      message: 'Signup successfully',
      results: this.toSafeUser(saved),
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    // normalize email เป็น lower-case และ trim
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ถ้ายืนยันแล้วให้ตอบกลับทันที
    if (user.verifyEmailAt) {
      return {
        message: 'Email already verified',
        results: this.toSafeUser(user),
      };
    }

    user.verifyEmailAt = new Date();
    user.isActive = 'Y';
    const saved = await this.usersRepo.save(user);

    return {
      message: 'Verify email successfully',
      results: this.toSafeUser(saved),
    };
  }

  async login(dto: LoginDto) {
    // หา user ตาม email และตรวจรหัสผ่าน
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersRepo.findOne({ where: { email } });
    if (
      !user ||
      !(await this.verifyPassword(dto.password, user.hashPassword))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isActive !== 'Y') {
      throw new UnauthorizedException('User is not active');
    }

    // ออก JWT ด้วย payload มาตรฐาน
    const tokens = await this.issueTokens(user);
    // เก็บ refresh token เป็น hash ใน DB
    user.refreshToken = await this.hashPassword(tokens.refreshToken);
    await this.usersRepo.save(user);

    return {
      message: 'Login successfully',
      results: {
        ...tokens,
        user: this.toSafeUser(user),
      },
    };
  }

  async logout(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.refreshToken = null;
    user.tokenVersion += 1; // revoke token เดิมทั้งหมด
    await this.usersRepo.save(user);

    return {
      message: 'Logout successfully',
      results: { acknowledged: true },
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ตรวจสอบรหัสผ่านเดิม
    const isMatch = await this.verifyPassword(
      dto.current_password,
      user.hashPassword,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // ถ้ารหัสผ่านใหม่เหมือนเดิมให้ reject เพื่อความปลอดภัย
    if (await this.verifyPassword(dto.new_password, user.hashPassword)) {
      throw new ConflictException(
        'New password must be different from current password',
      );
    }

    user.hashPassword = await this.hashPassword(dto.new_password);
    // reset refresh token และเพิ่ม tokenVersion เพื่อ revoke token เดิม
    user.refreshToken = null;
    user.tokenVersion += 1;

    const saved = await this.usersRepo.save(user);
    return {
      message: 'Change password successfully',
      results: this.toSafeUser(saved),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    // normalize email เป็น lower-case และ trim
    const email = dto.email.toLowerCase().trim();
    const user = await this.usersRepo.findOne({ where: { email } });

    // เพื่อลดข้อมูลรั่วไหล ให้ตอบกลับเหมือนกันไม่ว่าพบหรือไม่พบอีเมล
    const response = {
      message:
        'If the email exists, a password reset link has been sent to the registered email address',
      results: { acknowledged: true },
    };

    if (!user) {
      return response;
    }

    // สร้าง token และเวลาหมดอายุ
    const resetToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 นาที

    user.passwordResetToken = resetToken;
    user.passwordResetExpiresAt = expiresAt;
    await this.usersRepo.save(user);

    // ในระบบจริง ควรส่งอีเมลพร้อมลิงก์ที่มี token นี้
    return response;
  }

  async refreshToken(dto: RefreshTokenDto) {
    let payload:
      | (JwtPayload & {
          tokenVersion?: number;
        })
      | undefined;
    try {
      payload = await this.jwtService.verifyAsync<
        JwtPayload & { tokenVersion?: number }
      >(dto.refresh_token);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload?.sub || typeof payload.sub !== 'number') {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // ตรวจสอบ refresh token ที่เก็บใน DB (hash) ถ้ามี
    if (user.refreshToken) {
      const match = await this.verifyPassword(
        dto.refresh_token,
        user.refreshToken,
      );
      if (!match) {
        throw new UnauthorizedException('Refresh token is expired or revoked');
      }
    }

    // ตรวจสอบ tokenVersion เพื่อรองรับการ revoke
    if (
      typeof payload.tokenVersion !== 'number' ||
      payload.tokenVersion !== user.tokenVersion
    ) {
      throw new UnauthorizedException('Refresh token is expired or revoked');
    }

    // หมุน tokenVersion ทุกครั้งที่ออก refresh token ใหม่
    user.tokenVersion += 1;
    const saved = await this.usersRepo.save(user);

    const tokens = await this.issueTokens(saved);
    // อัปเดต refresh token ที่เก็บใน DB ด้วย hash ใหม่
    saved.refreshToken = await this.hashPassword(tokens.refreshToken);
    await this.usersRepo.save(saved);

    return {
      message: 'Refresh token successfully',
      results: tokens,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = Number(
      this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'),
    );
    return bcrypt.hash(password, saltRounds);
  }

  private async verifyPassword(
    incoming: string,
    hashed: string,
  ): Promise<boolean> {
    if (!incoming || !hashed) {
      return false;
    }
    return bcrypt.compare(incoming, hashed);
  }

  private toSafeUser(user: UserEntity) {
    // ตัดข้อมูลอ่อนไหวก่อนส่งกลับ
    const {
      hashPassword,
      refreshToken,
      passwordResetToken,
      passwordResetExpiresAt,
      ...rest
    } = user;
    // mark ฟิลด์ที่ไม่ต้องการใช้ เพื่อให้ linter ทราบว่าเจตนาตัดออก
    void hashPassword;
    void refreshToken;
    void passwordResetToken;
    void passwordResetExpiresAt;
    return rest;
  }

  private async issueTokens(user: UserEntity): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenVersion: number;
  }> {
    const payload = {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshExpires = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    ) as StringValue;
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: refreshExpires,
    });

    return { accessToken, refreshToken, tokenVersion: user.tokenVersion };
  }
}
