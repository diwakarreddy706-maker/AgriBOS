export type PersonnelRole = 'DRIVER' | 'OPERATOR' | 'HELPER' | 'FOREMAN';

export interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  roleName: PersonnelRole | string;
  specialization: string;
  assignedMachine: string;
  drivingLicense: string;
  dailyWageRate: number;
  villageLocation: string;
  experienceYears: number;
  rating: number;
  tripCount: number;
  status: 'ON TRIP' | 'ACTIVE' | 'ON LEAVE' | 'AVAILABLE' | string;
  mobileNumber: string;
  joiningDate?: string;
  department?: string;
  monthlySalary?: number;
  hourlyRate?: number;
  emergencyContact?: string;
  address?: string;
}

export interface EmployeeCreateInput {
  employeeCode?: string;
  fullName: string;
  roleName: PersonnelRole | string;
  specialization?: string;
  assignedMachine?: string;
  drivingLicense?: string;
  dailyWageRate?: number;
  villageLocation?: string;
  experienceYears?: number;
  status?: string;
  mobileNumber: string;
  joiningDate?: string;
  department?: string;
  monthlySalary?: number;
  hourlyRate?: number;
  emergencyContact?: string;
  address?: string;
}
