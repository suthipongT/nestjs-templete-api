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
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResendVerifyEmailDto } from './dto/resend-verify-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

// prefix /auth
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/signup รับข้อมูลสมัครสมาชิก
  @Post('signup')
  @ApiOperation({ summary: 'สมัครสมาชิกใหม่' })
  @ApiCreatedResponse({
    description: 'สมัครสมาชิกสำเร็จ',
    schema: {
      example: {
        message: 'Signup successfully',
        results: {
          user: {
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
          // dev เท่านั้น จะคืน verifyToken เพื่อทดสอบ
          verifyToken: 'verify-token-for-testing',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'ข้อมูลไม่ถูกต้อง' })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  // POST /auth/verify-email ยืนยันอีเมลของผู้ใช้
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ยืนยันอีเมล' })
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

  // POST /auth/resend-verify-email ขอส่งลิงก์ยืนยันอีเมลใหม่
  @Post('resend-verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ขอลิงก์ยืนยันอีเมลใหม่' })
  @ApiOkResponse({
    description: 'ระบบจะส่งลิงก์ยืนยันไปยังอีเมล (ถ้ามี)',
    schema: {
      example: {
        message: 'Verification link sent',
        results: {
          acknowledged: true,
          verifyToken: 'dev-only-token-returned-for-testing',
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'ข้อมูลไม่ถูกต้อง' })
  @Throttle({ default: { limit: 3, ttl: 60 } }) // จำกัดการขอซ้ำ
  resendVerifyEmail(@Body() dto: ResendVerifyEmailDto) {
    return this.authService.resendVerifyEmail(dto);
  }

  // POST /auth/login คืน access token เมื่อล็อกอินสำเร็จ
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'เข้าสู่ระบบ' })
  @ApiOkResponse({
    description: 'ล็อกอินสำเร็จ',
    schema: {
      example: {
        message: 'Login successfully',
        results: {
          accessToken: 'jwt-access-token',
          refreshToken: 'jwt-refresh-token',
          tokenVersion: 0,
          user: {
            id: 1,
            email: 'user@example.com',
            firstname: 'John',
            lastname: 'Doe',
            nickname: null,
            isActive: 'Y',
          },
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
  @ApiOperation({
    summary: 'ลืมรหัสผ่าน ขอ Token เพื่อนำไปเปลี่ยนรหัสผ่าน',
  })
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
  @Throttle({ default: { limit: 3, ttl: 60 } }) // จำกัดการขอซ้ำ
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // POST /auth/reset-password ตั้งรหัสผ่านใหม่ด้วย reset token (ไม่ต้องล็อกอิน)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'เปลี่ยนรหัสผ่านใหม่ผ่าน forgot password token',
  })
  @ApiOkResponse({
    description: 'เปลี่ยนรหัสผ่านสำเร็จ',
    schema: {
      example: {
        message: 'Reset password successfully',
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
  @ApiBadRequestResponse({ description: 'ข้อมูลไม่ถูกต้อง' })
  changePassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
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

  // POST /auth/logout เพิกถอน refresh token ปัจจุบัน
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'ออกจากระบบ',
  })
  @ApiOkResponse({
    description: 'ออกจากระบบสำเร็จและ revoke refresh token',
    schema: {
      example: {
        message: 'Logout successfully',
        results: { acknowledged: true },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'ต้องล็อกอินก่อน' })
  logout(
    @Req()
    req: Request & {
      user?: { userId: number; email: string };
    },
  ) {
    if (!req.user?.userId) {
      throw new Error('Unauthorized'); // JwtAuthGuard ควรกรองไว้แล้ว
    }
    return this.authService.logout(req.user.userId);
  }
}
