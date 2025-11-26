import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'duties' })
export class DutiesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // ชื่อหน้าที่
  @Column({ name: 'duty_name', type: 'varchar', length: 255, unique: true })
  dutyName: string;

  // flag สถานะการใช้งาน
  @Column({ name: 'isactive', type: 'char', length: 1, default: 'Y' })
  isActive: string;

  // ผู้สร้างเรคคอร์ด (optional)
  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy?: number | null;

  // เวลาสร้าง
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  // เวลาอัปเดตล่าสุด
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // ผู้แก้ไขล่าสุด (optional)
  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy?: number | null;
}
