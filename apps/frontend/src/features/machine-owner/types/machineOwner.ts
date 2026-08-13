export interface MachineOwner {
  id: number;
  ownerCode: string;
  fullName: string;
  mobileNumber: string;
  alternateMobile?: string;
  alternatePhone?: string;
  address: string;
  bankName?: string;
  accountNumber?: string;
  accountNo?: string;
  ifscCode?: string;
  upiId?: string;
  status: string;
  createdAt?: string;
}

export interface MachineOwnerCreateInput {
  ownerCode?: string;
  fullName: string;
  mobileNumber: string;
  alternateMobile?: string;
  alternatePhone?: string;
  address: string;
  bankName?: string;
  accountNumber?: string;
  accountNo?: string;
  ifscCode?: string;
  upiId?: string;
}
