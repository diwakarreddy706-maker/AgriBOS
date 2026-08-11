import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import { initDb } from './db/sqlite.js';
import { authenticateToken } from './middleware/auth.js';
import authController from './controllers/authController.js';
import farmerController from './controllers/farmerController.js';
import machineController from './controllers/machineController.js';
import operationsController from './controllers/operationsController.js';
import mastersController from './controllers/mastersController.js';
import machineOwnerController from './controllers/machineOwnerController.js';
import employeeController from './controllers/employeeController.js';
import vehicleComplianceController from './controllers/vehicleComplianceController.js';
import fuelController from './controllers/fuelController.js';
import inventoryController from './controllers/inventoryController.js';
import maintenanceController from './controllers/maintenanceController.js';
import billingController from './controllers/billingController.js';
import payablesController from './controllers/payablesController.js';
import analyticsController from './controllers/analyticsController.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import cookieParser from 'cookie-parser';
import { securityHeaders, loginRateLimiter, refreshRateLimiter, verifyCsrf } from './middleware/security.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173']
  : ['http://localhost:3000', 'http://localhost:5173'];

// Apply Helmet Security Headers & Cookie Parser
app.use(securityHeaders);
app.use(cookieParser());

// Strict Production CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    if (process.env.NODE_ENV !== 'production' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }
    return callback(new Error('CORS Policy: Origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Body parser with 1MB maximum payload limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply CSRF Protection Middleware for State-Changing Requests
app.use(verifyCsrf);

// API Routes
const apiRouter = express.Router();

// Swagger Documentation & Health Check (Public)
apiRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'AgriBOS JavaScript Backend', timestamp: new Date().toISOString() });
});

// Authentication Routes (Public with Rate Limiting)
apiRouter.post('/auth/login', loginRateLimiter, authController.login);
apiRouter.post('/auth/refresh', refreshRateLimiter, authController.refresh);
apiRouter.post('/auth/logout', authController.logout);

// Authentication Routes (Protected)
apiRouter.get('/auth/me', authenticateToken, authController.me);

// Masters Routes (Protected)
apiRouter.get('/masters/villages', authenticateToken, mastersController.getVillages);
apiRouter.get('/masters/crops', authenticateToken, mastersController.getCrops);
apiRouter.get('/masters/fuel-stations', authenticateToken, mastersController.getFuelStations);
apiRouter.get('/masters/expense-categories', authenticateToken, mastersController.getExpenseCategories);

// Machine Owners Routes (Protected)
apiRouter.get('/machine-owners', authenticateToken, machineOwnerController.getOwners);
apiRouter.post('/machine-owners', authenticateToken, machineOwnerController.createOwner);
apiRouter.delete('/machine-owners/:id', authenticateToken, machineOwnerController.deleteOwner);
apiRouter.get('/machine-owners/settlement-ledger', authenticateToken, machineOwnerController.getSettlementLedger);
apiRouter.post('/machine-owners/payout', authenticateToken, machineOwnerController.recordOwnerPayout);

// Employees Routes (Protected)
apiRouter.get('/employees', authenticateToken, employeeController.getEmployees);
apiRouter.post('/employees', authenticateToken, employeeController.createEmployee);
apiRouter.delete('/employees/:id', authenticateToken, employeeController.deleteEmployee);

// Farmers Routes (Protected)
apiRouter.get('/farmers', authenticateToken, farmerController.getFarmers);
apiRouter.get('/farmers/ledger-accounts', authenticateToken, farmerController.getLedgerAccounts);
apiRouter.get('/farmers/:id', authenticateToken, farmerController.getFarmerById);
apiRouter.post('/farmers', authenticateToken, farmerController.createFarmer);
apiRouter.put('/farmers/:id', authenticateToken, farmerController.updateFarmer);
apiRouter.delete('/farmers/:id', authenticateToken, farmerController.deleteFarmer);
apiRouter.post('/farmers/:farmerId/payment', authenticateToken, farmerController.recordPayment);

// Machines Routes (Protected)
apiRouter.get('/machines', authenticateToken, machineController.getMachines);
apiRouter.get('/machines/:id', authenticateToken, machineController.getMachineById);
apiRouter.post('/machines', authenticateToken, machineController.createMachine);
apiRouter.patch('/machines/:id/status', authenticateToken, machineController.updateStatus);
apiRouter.delete('/machines/:id', authenticateToken, machineController.deleteMachine);
apiRouter.post('/machines/:id/telematics', authenticateToken, machineController.postTelematics);
apiRouter.get('/machines/:id/telematics', authenticateToken, machineController.getTelematics);
apiRouter.post('/machines/:id/complete-service', authenticateToken, machineController.completeService);

// Vehicle Compliance Routes (Protected)
apiRouter.get('/vehicle-compliance', authenticateToken, vehicleComplianceController.getComplianceRecords);
apiRouter.post('/vehicle-compliance', authenticateToken, vehicleComplianceController.createComplianceRecord);
apiRouter.post('/vehicle-compliance/record-renewal', authenticateToken, vehicleComplianceController.recordRenewal);

// Operations, Bookings, Dispatches & Executions Routes (Protected)
apiRouter.get('/analytics/dashboard', authenticateToken, operationsController.getDashboardMetrics);
apiRouter.get('/dashboard/operations', authenticateToken, operationsController.getDashboardMetrics);
apiRouter.get('/operations/dashboard-metrics', authenticateToken, operationsController.getDashboardMetrics);
apiRouter.get('/analytics/machine-profitability', authenticateToken, analyticsController.getMachineProfitability);
apiRouter.get('/analytics/expense-breakdown', authenticateToken, analyticsController.getExpenseBreakdown);
apiRouter.get('/bookings', authenticateToken, operationsController.getBookings);
apiRouter.post('/bookings', authenticateToken, operationsController.createBooking);
apiRouter.patch('/bookings/:id/status', authenticateToken, operationsController.updateBookingStatus);
apiRouter.post('/bookings/assign-machine', authenticateToken, operationsController.assignMachine);
apiRouter.post('/bookings/assign-operator', authenticateToken, operationsController.assignOperator);
apiRouter.post('/bookings/:id/advance', authenticateToken, operationsController.recordAdvancePayment);
apiRouter.post('/dispatches', authenticateToken, operationsController.createDispatch);
apiRouter.post('/work-executions', authenticateToken, operationsController.logWorkExecution);

// Fuel Management Routes (Protected)
apiRouter.get('/dashboard/fuel', authenticateToken, fuelController.getDashboardMetrics);
apiRouter.get('/fuel-vouchers', authenticateToken, fuelController.getVouchers);
apiRouter.post('/fuel-vouchers', authenticateToken, fuelController.createVoucher);
apiRouter.patch('/fuel-vouchers/:id/status', authenticateToken, fuelController.updateVoucherStatus);
apiRouter.get('/fuel-logs', authenticateToken, fuelController.getFuelLogs);
apiRouter.post('/fuel-logs', authenticateToken, fuelController.logFuel);

// Inventory Routes (Protected)
apiRouter.get('/dashboard/inventory', authenticateToken, inventoryController.getDashboardMetrics);
apiRouter.get('/spare-parts', authenticateToken, inventoryController.getSpareParts);
apiRouter.get('/spare-parts/low-stock', authenticateToken, inventoryController.getLowStockItems);
apiRouter.post('/spare-parts', authenticateToken, inventoryController.createSparePart);

// Maintenance / Workshop Routes (Protected)
apiRouter.get('/workshop/dashboard', authenticateToken, maintenanceController.getDashboardMetrics);
apiRouter.get('/workshop/jobs', authenticateToken, maintenanceController.getJobCards);
apiRouter.post('/workshop/jobs', authenticateToken, maintenanceController.createJobCard);

// Customer Billing Routes (Protected)
apiRouter.get('/customer-invoices', authenticateToken, billingController.getInvoices);
apiRouter.post('/customer-invoices', authenticateToken, billingController.createInvoice);
apiRouter.get('/billing/finance-summary', authenticateToken, billingController.getFinanceSummary);

// Payroll / Payables Routes (Protected)
apiRouter.get('/payroll', authenticateToken, payablesController.getPayrollEntries);
apiRouter.post('/payroll/disburse', authenticateToken, payablesController.disbursePayroll);

app.use('/api/v1', apiRouter);

// Centralized Error and 404 Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize SQLite database and start server
initDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 AgriBOS JavaScript Backend running on port ${PORT}`);
      console.log(`📡 API endpoint available at /api/v1`);
      console.log(`📖 Swagger API Docs available at /api/v1/docs`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize SQLite database:', err);
    process.exit(1);
  });
