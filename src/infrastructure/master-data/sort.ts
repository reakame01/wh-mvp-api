import { Prisma } from '@prisma/client';

/** Sort fields shared by warehouse / location / category / supplier. */
export const CODE_SORT_FIELDS = ['createdAt', 'name', 'code'] as const;

/** Sort fields for products (sku instead of code). */
export const PRODUCT_SORT_FIELDS = ['createdAt', 'name', 'sku'] as const;

export type SortField = string;
export type SortOrder = Record<string, Prisma.SortOrder>[];

/** Primary sort + stable id tie-break for offset pagination. */
export function parseSort(
  sort: string | undefined,
  allowedFields: readonly SortField[],
  fallback: Prisma.SortOrder = 'desc',
): SortOrder {
  const allowed = new Set(allowedFields);
  if (!sort) {
    return [{ createdAt: fallback }, { id: 'asc' }];
  }
  const [field, dirRaw] = sort.split(':');
  const dir = dirRaw === 'asc' ? 'asc' : dirRaw === 'desc' ? 'desc' : fallback;
  if (!field || !allowed.has(field)) {
    return [{ createdAt: fallback }, { id: 'asc' }];
  }
  return [{ [field]: dir }, { id: 'asc' }];
}
