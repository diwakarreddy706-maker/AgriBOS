export type HealthStatus = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';

export interface MachineHealthScore {
  machineId: number;
  machineRegistrationNumber?: string;
  healthScore: number; // 0 to 100
  healthStatus: HealthStatus;
  totalBreakdownsCount: number;
  mtbfHours: number;
  mttrHours: number;
  lastInspectionDate: string;
  nextServiceDueHours: number;
  servicingCompliancePercentage: number;
}

export interface FleetAnalyticsSummary {
  averageFuelEfficiencyLph: number;
  totalFleetFuelCost: number;
  totalFleetMaintenanceCost: number;
  fleetAvailabilityPercentage: number;
  machineHealthScores: MachineHealthScore[];
}
