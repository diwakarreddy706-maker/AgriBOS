import { apiClient } from '../../../lib/apiClient';

export interface Village {
  id: number;
  villageCode: string;
  villageName: string;
  talukName: string;
  districtName: string;
  stateName: string;
  pincode?: string;
  isActive: boolean;
}

export interface Crop {
  id: number;
  cropCode: string;
  cropName: string;
  category: string;
  seasonName: string;
  description?: string;
  isActive: boolean;
}

export interface FuelStation {
  id: number;
  stationCode: string;
  stationName: string;
  address: string;
  contactPerson?: string;
  phoneNumber: string;
  isActive: boolean;
}

export interface ExpenseCategory {
  id: number;
  categoryCode: string;
  categoryName: string;
  description?: string;
  isActive: boolean;
}

export const mastersApi = {
  getVillages: async () => {
    const res = await apiClient.get<Village[]>('/masters/villages');
    return res.data;
  },
  getCrops: async () => {
    const res = await apiClient.get<Crop[]>('/masters/crops');
    return res.data;
  },
  getFuelStations: async () => {
    const res = await apiClient.get<FuelStation[]>('/masters/fuel-stations');
    return res.data;
  },
  getExpenseCategories: async () => {
    const res = await apiClient.get<ExpenseCategory[]>('/masters/expense-categories');
    return res.data;
  },
};
