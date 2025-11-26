import type { UserEntity } from '../../modules/user/entities/user.entity';

// ตัดข้อมูลอ่อนไหวออกจาก user ก่อนส่งกลับ
export function toSafeUser(user: UserEntity) {
  const {
    hashPassword,
    refreshToken,
    passwordResetToken,
    passwordResetExpiresAt,
    ...rest
  } = user;
  void hashPassword;
  void refreshToken;
  void passwordResetToken;
  void passwordResetExpiresAt;
  return rest;
}
