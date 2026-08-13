import { analyticsService } from '../services/analyticsService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * @openapi
 * /analytics/machine-profitability:
 *   get:
 *     summary: Retrieve per-machine financial profitability and efficiency metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: machineId
 *         schema:
 *           type: integer
 *         description: Optional machine ID filter
 *     responses:
 *       200:
 *         description: Successfully retrieved machine profitability metrics
 *       401:
 *         description: Unauthorized
 */
export const getMachineProfitability = async (req, res, next) => {
  try {
    const data = await analyticsService.getMachineProfitability(req.query);
    return sendSuccess(res, data, 'Machine profitability data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /analytics/expense-breakdown:
 *   get:
 *     summary: Retrieve category-wise expense breakdown (Fuel, Maintenance, Salaries, Spare Parts, Other)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved expense category breakdown
 *       401:
 *         description: Unauthorized
 */
export const getExpenseBreakdown = async (req, res, next) => {
  try {
    const data = await analyticsService.getExpenseBreakdown(req.query);
    return sendSuccess(res, data, 'Expense breakdown analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export default {
  getMachineProfitability,
  getExpenseBreakdown
};
