// รูปแบบ meta สำหรับข้อมูลแบ่งหน้า
export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

// ข้อมูลผลลัพธ์ที่มีรายการและ meta สำหรับ pagination
export interface PaginationResult<T> {
  items: T[];
  meta: PaginationMeta;
}

// รูปแบบ response กรณี success
export interface SuccessResponse<T> {
  statusCode: number;
  success: true;
  message: string;
  results: T;
}

// รายละเอียด error ที่ต้องการส่งกลับ
export interface ErrorDetail {
  field?: string;
  reason: string;
  code: string;
}

// รูปแบบ response กรณี error
export interface ErrorResponse {
  statusCode: number;
  success: false;
  message: string;
  error: ErrorDetail;
}

// ชนิดผลรวมสำหรับ success/error
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
