export interface VehicleComplianceRecord {
  id: number;
  registrationNumber: string;
  makeModelDescription: string;
  ownerName: string;
  ownerPhone: string;
  insurancePolicyNo: string;
  insuranceStatus: 'VALID' | 'EXPIRING SOON' | 'EXPIRED';
  insuranceExpiryDate: string;
  roadTaxReceiptNo: string;
  roadTaxStatus: 'VALID' | 'EXPIRING SOON' | 'EXPIRED';
  roadTaxExpiryDate: string;
  ncPermitStatusNo: string;
  ncPermitStatus: 'VALID' | 'EXPIRING SOON' | 'EXPIRED';
  ncPermitExpiryDate: string;
  fitnessExpiryDate: string;
  fitnessStatus: 'VALID' | 'EXPIRING SOON' | 'EXPIRED';
}

export interface RenewalRecordInput {
  vehicleId: number;
  docType: 'INSURANCE' | 'ROAD_TAX' | 'NC_PERMIT' | 'FITNESS';
  docNumber: string;
  newExpiryDate: string;
  notes?: string;
}
