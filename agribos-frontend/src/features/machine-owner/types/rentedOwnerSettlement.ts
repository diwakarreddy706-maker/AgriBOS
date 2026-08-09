export interface OwnerWorkExecution {
  id: number;
  workDate: string;
  farmerName: string;
  villageName: string;
  operationType: string;
  hoursOrAcres: string;
  grossBill: number;
  commissionPercent: number;
  commissionAmount: number;
  dieselDeduction: number;
  netOwnerPayout: number;
  status: 'AUDITED' | 'PENDING' | 'SETTLED';
}

export interface RentedOwnerSettlementLedger {
  id: number;
  ownerCode: string;
  ownerName: string;
  machineUnitName: string;
  registrationOrMachineNo: string;
  mobileNumber: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  auditStatus: 'READY FOR DISBURSEMENT' | 'PARTIAL DISBURSED' | 'PENDING AUDIT';
  grossWorkBilled: number;
  companyCommission: number;
  dieselDeduction: number;
  advancePaid: number;
  netOwnerPayable: number;
  workSessionsCount: number;
  workExecutions: OwnerWorkExecution[];
}

export interface OwnerPayoutInput {
  ownerId: number;
  amount: number;
  paymentMode: 'Bank Transfer' | 'UPI / PhonePe' | 'Cash';
  referenceNo?: string;
  notes?: string;
}
