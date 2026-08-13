export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
export type ReceiptStatus = 'CREATED' | 'POSTED' | 'RECONCILED' | 'CANCELLED';

export interface PaymentReceipt {
  id: number;
  receiptNumber: string;
  farmerId: number;
  farmerName?: string;
  invoiceId?: number;
  invoiceNumber?: string;
  paymentDate: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  status: ReceiptStatus;
  remarks?: string;
  createdAt: string;
}

export interface CashBookEntry {
  id: number;
  entryDate: string;
  entryType: 'CASH_IN' | 'CASH_OUT';
  amount: number;
  receiptId?: number;
  sourceDestination: string;
  narration?: string;
  runningCashBalance: number;
}

export interface DailyCashClosing {
  id: number;
  closingDate: string;
  openingCash: number;
  totalCashIn: number;
  totalCashOut: number;
  closingCash: number;
  physicalCashCounted: number;
  variance: number;
  status: string;
  notes?: string;
}
