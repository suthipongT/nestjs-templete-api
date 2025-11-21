import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Entity ผูกกับตาราง users
@Entity({ name: 'users' })
export class User {
  // คีย์หลัก auto-increment
  @PrimaryGeneratedColumn()
  id: number;

  // email ห้ามซ้ำ
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  // เก็บรหัสผ่านแบบ hash
  @Column({ name: 'hash_password', type: 'varchar', length: 255 })
  hashPassword: string;

  // ชื่อจริง
  @Column({ type: 'varchar', length: 100 })
  firstname: string;

  // นามสกุล
  @Column({ type: 'varchar', length: 100 })
  lastname: string;

  // ชื่อเล่น (optional)
  @Column({ type: 'varchar', length: 100, nullable: true })
  nickname?: string | null;

  // ลิงก์รูปโปรไฟล์ (optional)
  @Column({ name: 'profile_img', type: 'varchar', length: 255, nullable: true })
  profileImg?: string | null;

  // วันเกิด (optional)
  @Column({ type: 'date', nullable: true })
  birthday?: string | null;

  // refresh token ล่าสุด (optional)
  @Column({
    name: 'refresh_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  refreshToken?: string | null;

  // token สำหรับ reset password (optional)
  @Column({
    name: 'password_reset_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordResetToken?: string | null;

  @Column({
    name: 'password_reset_expires_at',
    type: 'datetime',
    nullable: true,
  })
  passwordResetExpiresAt?: Date | null;

  // เวลา verify email (optional)
  @Column({ name: 'verify_email_at', type: 'datetime', nullable: true })
  verifyEmailAt?: Date | null;

  // ใช้สำหรับ revoke refresh token รุ่นเก่า
  @Column({ name: 'token_version', type: 'int', default: 0 })
  tokenVersion: number;

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
