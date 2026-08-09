import apiClient from '../../../lib/apiClient';
import {
  Booking,
  BookingCreatePayload,
  DispatchCreatePayload,
  WorkExecutionCreatePayload,
  OperationsDashboardMetrics,
  RentMachineLedgerTicket,
} from '../types/operations';

export const operationsApi = {
  getDashboardMetrics: async (): Promise<OperationsDashboardMetrics> => {
    try {
      const res = await apiClient.get('/dashboard/operations');
      return res.data.data;
    } catch {
      return {
        todaysBookings: 0,
        machinesWorking: 0,
        machinesAvailable: 0,
        operatorsWorking: 0,
        dispatchesToday: 0,
        pendingAssignments: 0,
        jobsInProgress: 0,
        completedJobs: 0
      };
    }
  },

  getRentMachineLedgerTickets: async (search?: string, status?: string): Promise<RentMachineLedgerTicket[]> => {
    try {
      const res = await apiClient.get('/bookings', { params: { search, status } });
      const bookings = res.data?.data?.content || res.data?.data || [];
      if (Array.isArray(bookings)) {
        return bookings.map((b: any) => ({
          id: b.id,
          bookingNumber: b.bookingNumber || `BK-${b.id}`,
          bookingDate: b.bookingDate || '',
          preferredWorkDate: b.preferredWorkDate || '',
          farmerId: b.farmerId || 0,
          farmerName: b.farmerName || 'Farmer',
          farmerPhone: b.farmerPhone || '',
          villageName: b.villageName || '',
          machineId: b.machineId || 0,
          machineName: b.machineName || 'Machine',
          registrationNumber: b.registrationNumber || 'N/A',
          cropType: b.cropType || 'Crop',
          rateType: 'HOURLY',
          ratePerUnit: b.ratePerUnit || 2000,
          estimatedWorkUnits: b.estimatedHours || 0,
          totalEstimatedAmount: b.totalEstimatedAmount || 0,
          advanceAmountPaid: b.advanceAmountPaid || 0,
          paidAmount: b.paidAmount || 0,
          balanceDue: b.balanceDue || 0,
          status: b.status || 'CONFIRMED',
          priority: b.priority || 'NORMAL',
          notes: b.notes || ''
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  recordRentalAdvancePayment: async (bookingId: number, advanceAmount: number): Promise<void> => {
    try {
      await apiClient.post(`/bookings/${bookingId}/advance`, { advanceAmount });
    } catch {
      // noop
    }
  },

  getBookings: async (seasonId?: number, status?: string, search?: string, page = 0, size = 10) => {
    try {
      const res = await apiClient.get('/bookings', {
        params: { seasonId, status, search, page, size },
      });
      return res.data.data;
    } catch {
      return {
        content: [],
        page: 0,
        pageSize: 10,
        totalElements: 0,
        totalPages: 0,
        last: true
      };
    }
  },

  getBookingById: async (id: number): Promise<Booking> => {
    const res = await apiClient.get(`/bookings/${id}`);
    return res.data.data;
  },

  createBooking: async (payload: BookingCreatePayload): Promise<Booking> => {
    const res = await apiClient.post('/bookings', payload);
    return res.data.data;
  },

  updateBookingStatus: async (id: number, status: string): Promise<Booking> => {
    const res = await apiClient.patch(`/bookings/${id}/status`, null, {
      params: { status },
    });
    return res.data.data;
  },

  assignMachine: async (payload: { bookingId: number; machineId: number; expectedStartTime?: string; currentLocation?: string }) => {
    const res = await apiClient.post('/bookings/assign-machine', payload);
    return res.data.data;
  },

  assignOperator: async (payload: { bookingId: number; machineId: number; operatorEmployeeId: number; driverEmployeeId?: number }) => {
    const res = await apiClient.post('/bookings/assign-operator', payload);
    return res.data.data;
  },

  createDispatch: async (payload: DispatchCreatePayload) => {
    const res = await apiClient.post('/dispatches', payload);
    return res.data.data;
  },

  logWorkExecution: async (payload: WorkExecutionCreatePayload) => {
    const res = await apiClient.post('/work-executions', payload);
    return res.data.data;
  },
};
