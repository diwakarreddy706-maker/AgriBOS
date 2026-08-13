export const MACHINE_TYPES = {
  TRACTOR: 'TRACTOR',
  HARVESTER: 'HARVESTER',
  IMPLEMENT: 'IMPLEMENT',
} as const;

export type MachineType = typeof MACHINE_TYPES[keyof typeof MACHINE_TYPES];

export const MACHINE_STATUS = {
  AVAILABLE: 'AVAILABLE',
  IN_USE: 'IN_USE',
  MAINTENANCE: 'MAINTENANCE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE',
} as const;

export type MachineStatus = typeof MACHINE_STATUS[keyof typeof MACHINE_STATUS];

export const PAYMENT_MODES = {
  CASH: 'CASH',
  UPI: 'UPI',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHEQUE: 'CHEQUE',
} as const;

export type PaymentMode = typeof PAYMENT_MODES[keyof typeof PAYMENT_MODES];

export const PAYMENT_STATUS = {
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  UNPAID: 'UNPAID',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export const USER_ROLES = {
  PROPRIETOR: 'PROPRIETOR',
  MANAGER: 'MANAGER',
  AUDITOR: 'AUDITOR',
  OPERATOR: 'OPERATOR',
  DRIVER: 'DRIVER',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
