import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateDutyDto {
  @ApiProperty({ example: 'admin' })
  @IsNotEmpty({ message: 'ชื่อหน้าที่ต้องไม่ว่างเปล่า' })
  dutyName: string;
}

export class UpdateDutyDto {
  @ApiProperty({ example: 'admin' })
  @IsNotEmpty({ message: 'ชื่อหน้าที่ต้องไม่ว่างเปล่า' })
  dutyName: string;
}
