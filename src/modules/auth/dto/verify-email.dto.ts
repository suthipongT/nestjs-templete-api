// DTO สำหรับยืนยันอีเมลด้วย verify token
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'โทเคนสำหรับยืนยันอีเมล (รับจากลิงก์หรือระบบส่งอีเมล)',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBtYWlsLmNvbSIsInB1cnBvc2UiOiJ2ZXJpZnlfZW1haWwiLCJpYXQiOjE2OTAwMDAwMDAsImV4cCI6MTY5MDA4NjQwMH0.qwerty',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
