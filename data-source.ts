// data source สำหรับ CLI ของ TypeORM ใช้อ่าน .env เพื่อเชื่อมฐานข้อมูล
import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

// เลือกไฟล์ env ตาม NODE_ENV (production → .env.prod, อื่น ๆ → .env.dev)
const envFile =
  process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
config({ path: envFile });

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE ?? 'we2pos',
  // ยังไม่มี entity ในโปรเจกต์นี้ ใช้ migration เป็นตัวจัดการ schema
  entities: [],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false,
  charset: 'utf8mb4',
});
