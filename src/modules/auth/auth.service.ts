// บริการหลักของ auth จัดการ signup/login และ JWT
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { timingSafeEqual } from 'node:crypto';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
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
    const payload = { sub: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login successfully',
      results: { accessToken },
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      hashPassword,
      refreshToken,
      passwordResetToken,
      passwordResetExpiresAt,
      ...rest
    } = user;
    return rest;
  }
}
