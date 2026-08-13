export type BillStatus = 'DRAFT' | 'VERIFIED' | 'APPROVED' | 'POSTED' | 'PAID' | 'CANCELLED';
export type PayrollStatus = 'GENERATED' | 'APPROVED' | 'PAID';

export interface VendorBill {
  id: number;
  billNumber: string;
  supplierId: number;
  supplierName?: string;
  purchaseOrderId?: number;
  goodsReceiptId?: number;
  vendorInvoiceNumber: string;
  billDate: string;
  dueDate: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: BillStatus;
  isThreeWayMatched: boolean;
  notes?: string;
  createdAt: string;
}

export interface EmployeePayroll {
  id: number;
  payrollNumber: string;
  employeeId: number;
  employeeName?: string;
  payPeriodMonth: string;
  baseSalary: number;
  commissionEarned: number;
  advanceDeductions: number;
  netPayable: number;
  status: PayrollStatus;
  paymentDate?: string;
  createdAt: string;
}

export interface PayablesDashboardMetrics {
  totalAccountsPayable: number;
  pendingVendorBillsTotal: number;
  monthlyPayrollTotal: number;
  pendingBillsCount: number;
}
