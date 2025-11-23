// ใช้จัดการเส้นทาง auth
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// prefix /auth
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/signup รับข้อมูลสมัครสมาชิก
  @Post('signup')
  @ApiOperation({ summary: 'Signup' })
  @ApiCreatedResponse({
    description: 'สมัครสมาชิกสำเร็จ',
    schema: {
      example: {
        message: 'Signup successfully',
        results: {
          id: 1,
          email: 'user@example.com',
          firstname: 'John',
          lastname: 'Doe',
          nickname: null,
          birthday: '1990-01-01',
          isActive: 'Y',
          tokenVersion: 0,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'ข้อมูลไม่ถูกต้อง' })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  // POST /auth/login คืน access token เมื่อล็อกอินสำเร็จ
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login' })
  @ApiOkResponse({
    description: 'ล็อกอินสำเร็จ',
    schema: {
      example: {
        message: 'Login successfully',
        results: {
          accessToken: 'jwt-access-token',
          refreshToken: 'jwt-refresh-token',
          tokenVersion: 0,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'ข้อมูลรับรองไม่ถูกต้อง หรือผู้ใช้ไม่ใช้งาน',
  })
  @ApiBadRequestResponse({ description: 'ข้อมูลไม่ถูกต้อง' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // POST /auth/forgot-password ขอ reset password (ตอบกลับแบบ blind)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiOkResponse({
    description:
      'หากอีเมลมีอยู่ ระบบจะส่งลิงก์สำหรับ reset password ไปยังอีเมลนั้น',
    schema: {
      example: {
        message:
          'If the email exists, a password reset link has been sent to the registered email address',
        results: { acknowledged: true },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'ข้อมูลไม่ถูกต้อง' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // POST /auth/refresh-token ขอ access/refresh token ใหม่ด้วย refresh token เดิม
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh tokens' })
  @ApiOkResponse({
    description: 'ออก access/refresh token ชุดใหม่สำเร็จ',
    schema: {
      example: {
        message: 'Refresh token successfully',
        results: {
          accessToken: 'jwt-access-token',
          refreshToken: 'jwt-refresh-token',
          tokenVersion: 1,
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'ข้อมูลไม่ถูกต้อง' })
  @ApiUnauthorizedResponse({
    description: 'refresh token ไม่ถูกต้อง หรือถูก revoke',
  })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  // POST /auth/change-password ต้องล็อกอินและส่งรหัสผ่านเดิม/ใหม่ (เป็น hash)
  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password' })
  @ApiOkResponse({
    description: 'เปลี่ยนรหัสผ่านสำเร็จ',
    schema: {
      example: {
        message: 'Change password successfully',
        results: {
          id: 1,
          email: 'user@example.com',
          firstname: 'John',
          lastname: 'Doe',
          tokenVersion: 1,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'ต้องล็อกอินหรือรหัสผ่านเดิมไม่ถูกต้อง',
  })
  @ApiBadRequestResponse({ description: 'ข้อมูลไม่ถูกต้อง' })
  changePassword(
    @Req()
    req: Request & {
      user?: { userId: number; email: string };
    },
    @Body() dto: ChangePasswordDto,
  ) {
    if (!req.user?.userId) {
      throw new Error('Unauthorized'); // ควรไม่เกิดเพราะ JwtAuthGuard ตรวจสอบแล้ว
    }
    return this.authService.changePassword(req.user.userId, dto);
  }

  // POST /auth/verify-email ยืนยันอีเมลของผู้ใช้
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email' })
  @ApiOkResponse({
    description: 'ยืนยันอีเมลสำเร็จ',
    schema: {
      example: {
        message: 'Verify email successfully',
        results: {
          id: 1,
          email: 'user@example.com',
          firstname: 'John',
          lastname: 'Doe',
          verifyEmailAt: '2025-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'ข้อมูลไม่ถูกต้อง' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }
}
