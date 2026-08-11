import { operationsService } from '../services/operationsService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await operationsService.getDashboardMetrics();
    return sendSuccess(res, metrics, 'Dashboard metrics retrieved');
  } catch (error) {
    next(error);
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const result = await operationsService.getBookings(req.query);
    return sendSuccess(res, result.content, 'Bookings retrieved', {
      page: result.page,
      pageSize: result.pageSize,
      totalElements: result.totalElements,
      totalPages: result.totalPages,
      last: result.last
    });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const booking = await operationsService.createBooking(req.body);
    return sendSuccess(res, booking, 'Booking created successfully', null, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await operationsService.updateBookingStatus(req.params.id, req.query.status || req.body.status);
    return sendSuccess(res, booking, 'Booking status updated');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const assignMachine = async (req, res, next) => {
  try {
    const { bookingId, machineId } = req.body;
    const booking = await operationsService.assignMachine(bookingId, machineId);
    return sendSuccess(res, booking, 'Machine assigned to booking');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const createDispatch = async (req, res, next) => {
  try {
    const dispatch = await operationsService.createDispatch(req.body);
    return sendSuccess(res, dispatch, 'Machine dispatch created successfully', null, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const logWorkExecution = async (req, res, next) => {
  try {
    const workEntry = await operationsService.logWorkExecution(req.body);
    return sendSuccess(res, workEntry, 'Work execution logged successfully', null, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const assignOperator = async (req, res, next) => {
  try {
    const { bookingId, operatorEmployeeId, driverEmployeeId } = req.body;
    const booking = await operationsService.assignOperator(bookingId, operatorEmployeeId, driverEmployeeId);
    return sendSuccess(res, booking, 'Operator assigned to booking');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export const recordAdvancePayment = async (req, res, next) => {
  try {
    const { advanceAmount } = req.body;
    const booking = await operationsService.recordAdvancePayment(req.params.id, advanceAmount);
    return sendSuccess(res, booking, 'Advance payment recorded');
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

export default {
  getDashboardMetrics,
  getBookings,
  createBooking,
  updateBookingStatus,
  assignMachine,
  createDispatch,
  logWorkExecution,
  assignOperator,
  recordAdvancePayment
};
