export interface JournalBatch {
  id: number;
  batchNumber: string;
  postingDate: string;
  periodId: number;
  sourceModule: string;
  referenceId?: number;
  totalDebit: number;
  totalCredit: number;
  status: 'POSTED' | 'LOCKED' | 'REVERSED';
  narration: string;
  createdAt: string;
}

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
}

export interface ProfitAndLoss {
  totalHarvestRevenue: number;
  totalFuelExpense: number;
  totalMaintenanceExpense: number;
  totalOperatorPayroll: number;
  totalOperatingExpense: number;
  grossProfit: number;
  netProfit: number;
}

export interface BalanceSheet {
  cashAndBank: number;
  accountsReceivable: number;
  inventoryValue: number;
  totalCurrentAssets: number;
  machineFixedAssets: number;
  totalAssets: number;
  accountsPayable: number;
  totalLiabilities: number;
  ownersEquity: number;
  retainedEarnings: number;
  totalLiabilitiesAndEquity: number;
}
