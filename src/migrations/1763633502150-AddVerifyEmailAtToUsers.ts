import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerifyEmailAtToUsers1763633502150
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `users` ADD COLUMN `verify_email_at` datetime NULL AFTER `password_reset_expires_at`',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `users` DROP COLUMN `verify_email_at`',
    );
  }
}
