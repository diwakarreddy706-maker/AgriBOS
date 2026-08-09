import { mastersRepository } from '../repositories/mastersRepository.js';

export const mastersService = {
  getVillages: () => mastersRepository.getVillages(),
  getCrops: () => mastersRepository.getCrops(),
  getFuelStations: () => mastersRepository.getFuelStations(),
  getExpenseCategories: () => mastersRepository.getExpenseCategories()
};
