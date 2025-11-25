import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDutiesTable1764083798973 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'duties',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'duty_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
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
            name: 'idx_duties_isactive',
            columnNames: ['isactive'],
          },
          {
            name: 'idx_duties_name',
            columnNames: ['duty_name'],
          },
          {
            name: 'idx_duties_group',
            columnNames: ['duty_name', 'isactive'],
          },
        ],
        uniques: [
          {
            name: 'duty_name',
            columnNames: ['duty_name'],
          },
        ],
        foreignKeys: [
          {
            name: 'fk_duty_created_by',
            columnNames: ['created_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
          },
          {
            name: 'fk_duty_updated_by',
            columnNames: ['updated_by'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
          },
        ],
        engine: 'InnoDB',
      }),
    );
    await queryRunner.query(
      'ALTER TABLE `duties` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('duties', true, true);
  }
}
