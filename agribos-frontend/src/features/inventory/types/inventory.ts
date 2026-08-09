export interface SparePart {
  id: number;
  partNumber: string;
  partName: string;
  category: string;
  unitOfMeasure: string;
  currentStock: number;
  minimumStockLevel: number;
  reorderQuantity: number;
  unitCost: number;
  locationRack?: string;
  supplierId?: number;
  supplierName?: string;
  isLowStock: boolean;
  createdAt: string;
}

export type POStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CLOSED' | 'CANCELLED';

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  supplierId: number;
  supplierName?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  totalAmount: number;
  status: POStatus;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: number;
  supplierCode: string;
  supplierName: string;
  contactPerson?: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  rating: number;
  isActive: boolean;
  createdAt: string;
}

export interface InventoryDashboardMetrics {
  currentInventoryValue: number;
  lowStockItemCount: number;
  pendingPurchaseOrders: number;
  totalSuppliers: number;
}
