import { Prisma } from '@prisma/client';

const ALLOWED = new Set(['createdAt', 'name', 'code']);

export function parseSort(
  sort: string | undefined,
  fallback: Prisma.SortOrder = 'desc',
): Record<string, Prisma.SortOrder> {
  if (!sort) {
    return { createdAt: fallback };
  }
  const [field, dirRaw] = sort.split(':');
  const dir = dirRaw === 'asc' ? 'asc' : dirRaw === 'desc' ? 'desc' : fallback;
  if (!field || !ALLOWED.has(field)) {
    return { createdAt: fallback };
  }
  return { [field]: dir };
}
