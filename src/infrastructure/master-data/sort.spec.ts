import { parseSort } from './sort';

describe('parseSort', () => {
  const codeFields = ['createdAt', 'name', 'code'] as const;
  const productFields = ['createdAt', 'name', 'sku'] as const;

  it('falls back to createdAt when sort omitted', () => {
    expect(parseSort(undefined, codeFields)).toEqual([
      { createdAt: 'desc' },
      { id: 'asc' },
    ]);
  });

  it('allows code for warehouse/category-style resources', () => {
    expect(parseSort('code:asc', codeFields)).toEqual([
      { code: 'asc' },
      { id: 'asc' },
    ]);
  });

  it('allows sku for products', () => {
    expect(parseSort('sku:asc', productFields)).toEqual([
      { sku: 'asc' },
      { id: 'asc' },
    ]);
  });

  it('falls back when sku is not allowed for the resource', () => {
    expect(parseSort('sku:asc', codeFields)).toEqual([
      { createdAt: 'desc' },
      { id: 'asc' },
    ]);
  });

  it('falls back when code is not allowed for products', () => {
    expect(parseSort('code:asc', productFields)).toEqual([
      { createdAt: 'desc' },
      { id: 'asc' },
    ]);
  });

  it('falls back for unknown fields', () => {
    expect(parseSort('price:desc', productFields)).toEqual([
      { createdAt: 'desc' },
      { id: 'asc' },
    ]);
  });
});
