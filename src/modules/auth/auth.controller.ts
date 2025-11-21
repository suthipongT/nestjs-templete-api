// ใช้จัดการเส้นทาง auth
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

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
        results: { accessToken: 'jwt-token' },
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
}
