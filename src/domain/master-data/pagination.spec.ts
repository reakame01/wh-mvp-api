import { buildPageMeta, normalizePageQuery } from './pagination';

describe('pagination helpers', () => {
  it('defaults page and pageSize', () => {
    expect(normalizePageQuery(undefined, undefined)).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it('caps pageSize at 100', () => {
    expect(normalizePageQuery(2, 500)).toEqual({ page: 2, pageSize: 100 });
  });

  it('computes totalPages', () => {
    expect(buildPageMeta(1, 20, 45)).toEqual({
      page: 1,
      pageSize: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it('returns zero totalPages when empty', () => {
    expect(buildPageMeta(1, 20, 0).totalPages).toBe(0);
  });
});
