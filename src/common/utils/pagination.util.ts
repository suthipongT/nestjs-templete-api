export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

export function buildPagination(
  pageInput?: number | string,
  limitInput?: number | string,
  options: PaginationOptions = {},
) {
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 100;

  const page = Math.max(1, Number(pageInput) || 1);
  const rawLimit = Number(limitInput) || defaultLimit;
  const limit = Math.max(1, Math.min(rawLimit, maxLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip, take: limit };
}
