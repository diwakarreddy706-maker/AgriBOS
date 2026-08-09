export type BreakdownSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BreakdownStatus = 'REPORTED' | 'INSPECTED' | 'APPROVED' | 'REPAIRING' | 'READY' | 'RESOLVED' | 'CANCELLED';

export interface Breakdown {
  id: number;
  breakdownNumber: string;
  machineId: number;
  reportedByEmployeeId: number;
  breakdownDate: string;
  locationName: string;
  severity: BreakdownSeverity;
  category: string;
  description: string;
  status: BreakdownStatus;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export type JobStatus = 'CREATED' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'TESTING' | 'COMPLETED' | 'CLOSED' | 'CANCELLED';
export type MaintenanceType = 'PREVENTIVE' | 'BREAKDOWN' | 'OVERHAUL' | 'INSPECTION';

export interface MaintenanceJob {
  id: number;
  jobNumber: string;
  machineId: number;
  breakdownId?: number;
  jobType: MaintenanceType;
  assignedTechnicianId?: number;
  startDate: string;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  status: JobStatus;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  summaryNotes?: string;
  createdAt: string;
}

export interface WorkshopDashboardMetrics {
  activeBreakdowns: number;
  machinesUnderMaintenance: number;
  jobsWaitingParts: number;
  jobsInProgress: number;
  completedToday: number;
  serviceDue: number;
}
