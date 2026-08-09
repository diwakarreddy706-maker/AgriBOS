import { apiClient } from '../../../lib/apiClient';
import { Employee, EmployeeCreateInput } from '../types/employee';
import { PageResponse } from '../../../types/api';

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 1,
    employeeCode: 'DRV-001',
    fullName: 'Sharanu Gowda',
    roleName: 'OPERATOR',
    specialization: 'Heavy Tractor Operator',
    assignedMachine: 'John Deere JD-5050 (KA-36-T-1029)',
    drivingLicense: 'KA-36-2019-00128',
    dailyWageRate: 850,
    villageLocation: 'Alabanur Village',
    experienceYears: 7,
    rating: 4.9,
    tripCount: 142,
    status: 'ON TRIP',
    mobileNumber: '9845123456',
    joiningDate: '2019-04-12',
    department: 'OPERATIONS'
  },
  {
    id: 2,
    employeeCode: 'DRV-002',
    fullName: 'Basavaraj Patil',
    roleName: 'OPERATOR',
    specialization: 'Combine Harvester Master',
    assignedMachine: 'Preet 955 Harvester (KA-36-H-8820)',
    drivingLicense: 'KA-36-2021-00441',
    dailyWageRate: 1200,
    villageLocation: 'Sindhanur Taluk',
    experienceYears: 10,
    rating: 4.8,
    tripCount: 98,
    status: 'ACTIVE',
    mobileNumber: '9845234567',
    joiningDate: '2021-06-01',
    department: 'OPERATIONS'
  },
  {
    id: 3,
    employeeCode: 'DRV-003',
    fullName: 'Ramesh Naik',
    roleName: 'DRIVER',
    specialization: 'Tractor & Rotavator Driver',
    assignedMachine: 'Mahindra 575 DI (KA-36-T-4411)',
    drivingLicense: 'KA-36-2022-00812',
    dailyWageRate: 800,
    villageLocation: 'Gorebal',
    experienceYears: 4,
    rating: 4.6,
    tripCount: 64,
    status: 'ACTIVE',
    mobileNumber: '9845345678',
    joiningDate: '2022-02-15',
    department: 'OPERATIONS'
  },
  {
    id: 4,
    employeeCode: 'DRV-004',
    fullName: 'Venkatesh S.',
    roleName: 'DRIVER',
    specialization: 'Field Tillage Driver',
    assignedMachine: 'Swaraj 855 FE (KA-36-T-5900)',
    drivingLicense: 'KA-36-2018-00095',
    dailyWageRate: 850,
    villageLocation: 'Turvihal',
    experienceYears: 6,
    rating: 4.7,
    tripCount: 85,
    status: 'ON LEAVE',
    mobileNumber: '9845456789',
    joiningDate: '2018-09-10',
    department: 'OPERATIONS'
  },
  {
    id: 5,
    employeeCode: 'HLP-001',
    fullName: 'Hanumanthappa K.',
    roleName: 'HELPER',
    specialization: 'Combine Harvester Helper',
    assignedMachine: 'Preet 955 Harvester (KA-36-H-8820)',
    drivingLicense: 'N/A (Helper)',
    dailyWageRate: 550,
    villageLocation: 'Alabanur',
    experienceYears: 3,
    rating: 4.8,
    tripCount: 112,
    status: 'ACTIVE',
    mobileNumber: '9845567890',
    joiningDate: '2023-01-10',
    department: 'FIELD_HELP'
  },
  {
    id: 6,
    employeeCode: 'FRM-001',
    fullName: 'Devappa Gowda',
    roleName: 'FOREMAN',
    specialization: 'Field Operations & Fleet Foreman',
    assignedMachine: 'Bolero Pickup (KA-36-M-0912)',
    drivingLicense: 'KA-36-2014-00210',
    dailyWageRate: 1500,
    villageLocation: 'Sindhanur',
    experienceYears: 12,
    rating: 5.0,
    tripCount: 310,
    status: 'ACTIVE',
    mobileNumber: '9845678901',
    joiningDate: '2014-05-20',
    department: 'SUPERVISION'
  }
];

let localEmployees: Employee[] = [...INITIAL_EMPLOYEES];

export const employeeApi = {
  getEmployees: async (search?: string, page = 0, size = 10, roleFilter?: string, statusFilter?: string): Promise<PageResponse<Employee>> => {
    try {
      const res = await apiClient.get<any>('/employees', {
        params: { search, page, size, roleFilter, statusFilter },
      });
      const data = res.data?.data || res.data;
      if (data && Array.isArray(data.content) && data.content.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Backend /employees unreachable, using local directory store', e);
    }

    let filtered = [...localEmployees];
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.fullName.toLowerCase().includes(q) ||
          e.mobileNumber.includes(q) ||
          e.drivingLicense.toLowerCase().includes(q) ||
          e.specialization.toLowerCase().includes(q) ||
          e.villageLocation.toLowerCase().includes(q)
      );
    }

    if (roleFilter && roleFilter !== 'ALL') {
      filtered = filtered.filter((e) => e.roleName.toUpperCase() === roleFilter.toUpperCase());
    }

    if (statusFilter && statusFilter !== 'ALL') {
      filtered = filtered.filter((e) => e.status.toUpperCase() === statusFilter.toUpperCase());
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const start = page * size;
    const content = filtered.slice(start, start + size);

    return {
      content,
      totalElements,
      totalPages,
      size,
      number: page,
      first: page === 0,
      last: page >= totalPages - 1,
      empty: content.length === 0,
    };
  },

  createEmployee: async (data: EmployeeCreateInput): Promise<Employee> => {
    try {
      const res = await apiClient.post<any>('/employees', data);
      const saved = res.data?.data || res.data;
      if (saved && saved.id) return saved;
    } catch (e) {
      console.warn('Backend create failed, saving locally', e);
    }

    const newEmp: Employee = {
      id: Date.now(),
      employeeCode: data.employeeCode || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      fullName: data.fullName,
      roleName: data.roleName || 'DRIVER',
      specialization: data.specialization || `${data.roleName} Specialist`,
      assignedMachine: data.assignedMachine || 'Unassigned Machine',
      drivingLicense: data.drivingLicense || 'KA-36-PENDING',
      dailyWageRate: Number(data.dailyWageRate) || 850,
      villageLocation: data.villageLocation || 'Sindhanur',
      experienceYears: Number(data.experienceYears) || 3,
      rating: 5.0,
      tripCount: 0,
      status: data.status || 'ACTIVE',
      mobileNumber: data.mobileNumber,
      joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
      department: data.department || 'OPERATIONS',
    };

    localEmployees.unshift(newEmp);
    return newEmp;
  },

  deleteEmployee: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/employees/${id}`);
    } catch (e) {
      console.warn('Backend delete failed, removing locally', e);
    }
    localEmployees = localEmployees.filter((e) => e.id !== id);
  },
};

