import { mastersService } from '../services/mastersService.js';
import { sendSuccess } from '../utils/response.js';

export const getVillages = async (req, res, next) => {
  try {
    const list = await mastersService.getVillages();
    return sendSuccess(res, list, 'Villages retrieved');
  } catch (error) {
    next(error);
  }
};

export const getCrops = async (req, res, next) => {
  try {
    const list = await mastersService.getCrops();
    return sendSuccess(res, list, 'Crops retrieved');
  } catch (error) {
    next(error);
  }
};

export const getFuelStations = async (req, res, next) => {
  try {
    const list = await mastersService.getFuelStations();
    return sendSuccess(res, list, 'Fuel stations retrieved');
  } catch (error) {
    next(error);
  }
};

export const getExpenseCategories = async (req, res, next) => {
  try {
    const list = await mastersService.getExpenseCategories();
    return sendSuccess(res, list, 'Expense categories retrieved');
  } catch (error) {
    next(error);
  }
};

export default {
  getVillages,
  getCrops,
  getFuelStations,
  getExpenseCategories
};
