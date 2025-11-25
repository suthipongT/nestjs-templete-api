// DTO สำหรับตั้งรหัสผ่านใหม่ด้วย reset token
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'โทเคน reset password ที่ได้จากลิงก์ในอีเมล',
    example: 'reset-token-from-email-or-dev-response',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'new-password-plain' })
  @IsString()
  @IsNotEmpty()
  new_password: string;
}
