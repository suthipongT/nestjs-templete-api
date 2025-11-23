// DTO สำหรับยืนยันอีเมล
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import type { IsEmailOptions } from 'validator';

// helper ให้ IsEmail มี type ชัดเจน
const EmailDecorator = (
  options?: IsEmailOptions,
  validationOptions?: Parameters<typeof IsEmail>[1],
): PropertyDecorator =>
  (
    IsEmail as (
      options?: IsEmailOptions,
      validationOptions?: Parameters<typeof IsEmail>[1],
    ) => PropertyDecorator
  )(options, validationOptions);

export class VerifyEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @EmailDecorator()
  @IsNotEmpty()
  email: string;
}
