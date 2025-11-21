// DTO สำหรับรับข้อมูลล็อกอิน พร้อม validation
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'hashed-password-here' })
  @IsString()
  @IsNotEmpty()
  hash_password: string;
}
