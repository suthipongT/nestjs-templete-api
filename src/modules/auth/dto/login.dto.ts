// DTO สำหรับรับข้อมูลล็อกอิน พร้อม validation
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import type { ValidationOptions } from 'class-validator';
import type { IsEmailOptions } from 'validator';

// ห่อ decorator IsEmail ให้มี type ชัดเจน ปิดคำเตือน no-unsafe-call
const EmailDecorator = (
  options?: IsEmailOptions,
  validationOptions?: ValidationOptions,
): PropertyDecorator =>
  (
    IsEmail as (
      options?: IsEmailOptions,
      validationOptions?: ValidationOptions,
    ) => PropertyDecorator
  )(options, validationOptions);

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @EmailDecorator()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'hashed-password-here' })
  @IsString()
  @IsNotEmpty()
  hash_password: string;
}
