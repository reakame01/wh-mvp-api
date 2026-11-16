export type PageQuery = {
  page: number;
  pageSize: number;
};

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PagedResult<T> = {
  data: T[];
  meta: PageMeta;
};

export function normalizePageQuery(
  page?: number,
  pageSize?: number,
): PageQuery {
  const safePage = !page || page < 1 ? 1 : Math.floor(page);
  let safeSize = !pageSize || pageSize < 1 ? 20 : Math.floor(pageSize);
  if (safeSize > 100) {
    safeSize = 100;
  }
  return { page: safePage, pageSize: safeSize };
}

export function buildPageMeta(
  page: number,
  pageSize: number,
  total: number,
): PageMeta {
  const totalPages = pageSize <= 0 ? 0 : Math.ceil(total / pageSize);
  return { page, pageSize, total, totalPages };
}
