export type Product = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  categoryId: string;
  unit: string;
  /** Exact decimal as string (never float). */
  reorderPoint: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
