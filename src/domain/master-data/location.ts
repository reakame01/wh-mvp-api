export type Location = {
  id: string;
  warehouseId: string;
  parentLocationId: string | null;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
