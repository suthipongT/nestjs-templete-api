import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetUserPasswordDto {
  @ApiProperty({ example: 'new-password-plain' })
  @IsString()
  @IsNotEmpty()
  new_password: string;
}
