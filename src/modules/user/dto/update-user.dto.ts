import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'John', required: false })
  @IsString()
  @IsOptional()
  firstname?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsString()
  @IsOptional()
  lastname?: string;

  @ApiProperty({ example: 'JD', required: false })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsDateString()
  @IsOptional()
  birthday?: string;

  @ApiProperty({
    description: 'URL หรือ path ของรูปโปรไฟล์ (ถ้าอัปโหลดไฟล์จะตั้งค่าให้อัตโนมัติ)',
    required: false,
    example: '/uploads/profiles/avatar.jpg',
  })
  @IsString()
  @IsOptional()
  profileImg?: string;
}
