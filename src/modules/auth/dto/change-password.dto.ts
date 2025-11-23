// DTO สำหรับเปลี่ยนรหัสผ่าน (ใช้ค่า hash ของรหัสผ่าน)
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'current-hashed-password' })
  @IsString()
  @IsNotEmpty()
  current_password: string;

  @ApiProperty({ example: 'new-hashed-password' })
  @IsString()
  @IsNotEmpty()
  new_password: string;
}
