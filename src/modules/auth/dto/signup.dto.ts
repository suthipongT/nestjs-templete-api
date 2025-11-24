// DTO สำหรับรับข้อมูลสมัครสมาชิก พร้อม validation
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import type { ValidationOptions } from 'class-validator';
import type { IsEmailOptions } from 'validator';

// ห่อ decorator IsEmail ให้ type ชัด ปิดคำเตือน no-unsafe-call
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

export class SignupDto {
  @ApiProperty({ example: 'user@example.com' })
  @EmailDecorator()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'plain-password' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty({ example: 'JD', required: false })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsDateString()
  @IsOptional()
  birthday?: string;
}
