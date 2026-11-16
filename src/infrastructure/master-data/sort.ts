import { Prisma } from '@prisma/client';

const ALLOWED = new Set(['createdAt', 'name', 'code']);

export type SortOrder = Record<string, Prisma.SortOrder>[];

/** Primary sort + stable id tie-break for offset pagination. */
export function parseSort(
  sort: string | undefined,
  fallback: Prisma.SortOrder = 'desc',
): SortOrder {
  if (!sort) {
    return [{ createdAt: fallback }, { id: 'asc' }];
  }
  const [field, dirRaw] = sort.split(':');
  const dir = dirRaw === 'asc' ? 'asc' : dirRaw === 'desc' ? 'desc' : fallback;
  if (!field || !ALLOWED.has(field)) {
    return [{ createdAt: fallback }, { id: 'asc' }];
  }
  return [{ [field]: dir }, { id: 'asc' }];
}
