import { diskStorage } from 'multer';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { randomBytes } from 'node:crypto';

// สร้างตัวเลือก storage สำหรับอัปโหลดรูปโปรไฟล์ผู้ใช้
export function profileImageMulterOptions() {
  return {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), 'uploads', 'user', 'profile');
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const base = path.basename(file.originalname, ext);
        const suffix = randomBytes(6).toString('hex');
        const safeName = `${base}-${Date.now()}-${suffix}${ext}`;
        cb(null, safeName);
      },
    }),
  };
}

// คืน path ที่จะเก็บในฐานข้อมูลจากไฟล์ที่อัปโหลด
export function buildProfileImagePath(file?: Express.Multer.File): string | undefined {
  return file ? `/uploads/user/profile/${file.filename}` : undefined;
}
