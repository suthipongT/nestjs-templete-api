// DTO สำหรับขอ refresh token
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'refresh token ที่ได้จากการล็อกอิน/รีเฟรชครั้งก่อน',
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
