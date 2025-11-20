import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1763633430612 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'hash_password',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'firstname',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'lastname',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'nickname',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'profile_img',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'birthday',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'refresh_token',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'password_reset_token',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'password_reset_expires_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'token_version',
            type: 'int',
            isNullable: false,
            default: '0',
          },
          {
            name: 'isactive',
            type: 'char',
            length: '1',
            isNullable: false,
            default: "'Y'",
          },
          {
            name: 'created_by',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_by',
            type: 'int',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'idx_users_isactive',
            columnNames: ['isactive'],
          },
          {
            name: 'idx_users_name',
            columnNames: ['firstname', 'lastname'],
          },
        ],
        uniques: [
          {
            name: 'email',
            columnNames: ['email'],
          },
        ],
        foreignKeys: [
          {
            name: 'fk_users_created_by',
            columnNames: ['created_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
          },
          {
            name: 'fk_users_updated_by',
            columnNames: ['updated_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
          },
        ],
        engine: 'InnoDB',
      }),
    );
    await queryRunner.query(
      'ALTER TABLE `users` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users', true, true);
  }
}
