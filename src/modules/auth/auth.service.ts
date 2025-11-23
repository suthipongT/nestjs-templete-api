// บริการหลักของ auth จัดการ signup/login และ JWT
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
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
    const user = this.usersRepo.create({
      email,
      hashPassword: dto.hash_password,
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
    if (!user || !this.isPasswordMatch(dto.hash_password, user.hashPassword)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.isActive !== 'Y') {
      throw new UnauthorizedException('User is not active');
    }

    // ออก JWT ด้วย payload มาตรฐาน
    const tokens = await this.issueTokens(user);

    return {
      message: 'Login successfully',
      results: tokens,
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ตรวจสอบรหัสผ่านเดิม
    const isMatch = this.isPasswordMatch(
      dto.current_password,
      user.hashPassword,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // ถ้ารหัสผ่านใหม่เหมือนเดิมให้ reject เพื่อความปลอดภัย
    if (this.isPasswordMatch(dto.new_password, user.hashPassword)) {
      throw new ConflictException(
        'New password must be different from current password',
      );
    }

    user.hashPassword = dto.new_password;
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
      | {
          sub: number;
          email: string;
          tokenVersion?: number;
        }
      | undefined;
    try {
      payload = await this.jwtService.verifyAsync(dto.refresh_token);
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
    return {
      message: 'Refresh token successfully',
      results: tokens,
    };
  }

  // เปรียบเทียบรหัสผ่านแบบ timing-safe (ปัจจุบันรับ hash ตรง ๆ)
  private isPasswordMatch(incoming: string, stored: string): boolean {
    const incomingBuffer = Buffer.from(incoming);
    const storedBuffer = Buffer.from(stored);
    if (incomingBuffer.length !== storedBuffer.length) {
      return false;
    }
    return timingSafeEqual(incomingBuffer, storedBuffer);
  }

  private toSafeUser(user: User) {
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

  private async issueTokens(user: User): Promise<{
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
    );
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: refreshExpires,
    });

    return { accessToken, refreshToken, tokenVersion: user.tokenVersion };
  }
}
