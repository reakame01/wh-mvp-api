export const PERMISSION_CODES = [
  'users:read',
  'users:write',
  'categories:read',
  'categories:write',
  'suppliers:read',
  'suppliers:write',
  'products:read',
  'products:write',
  'warehouses:read',
  'warehouses:write',
  'locations:read',
  'locations:write',
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];
