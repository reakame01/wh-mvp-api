import { Prisma } from '@prisma/client';

const BALANCE_SORT_FIELDS = ['updatedAt', 'onHand'] as const;
const MOVEMENT_SORT_FIELDS = ['createdAt', 'quantityDelta'] as const;

export function parseBalanceSort(
  sort: string | undefined,
): Prisma.StockBalanceOrderByWithRelationInput[] {
  const fallback: Prisma.StockBalanceOrderByWithRelationInput[] = [
    { updatedAt: 'desc' },
    { productId: 'asc' },
    { locationId: 'asc' },
  ];
  if (!sort) {
    return fallback;
  }
  const [field, dirRaw] = sort.split(':');
  const dir = dirRaw === 'asc' ? 'asc' : 'desc';
  if (!field || !(BALANCE_SORT_FIELDS as readonly string[]).includes(field)) {
    return fallback;
  }
  return [{ [field]: dir }, { productId: 'asc' }, { locationId: 'asc' }];
}

export function parseMovementSort(
  sort: string | undefined,
): Prisma.StockMovementOrderByWithRelationInput[] {
  const fallback: Prisma.StockMovementOrderByWithRelationInput[] = [
    { createdAt: 'desc' },
    { id: 'asc' },
  ];
  if (!sort) {
    return fallback;
  }
  const [field, dirRaw] = sort.split(':');
  const dir = dirRaw === 'asc' ? 'asc' : 'desc';
  if (!field || !(MOVEMENT_SORT_FIELDS as readonly string[]).includes(field)) {
    return fallback;
  }
  return [{ [field]: dir }, { id: 'asc' }];
}
