import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthLayout } from './components/layout/AuthLayout';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FarmerListPage } from './features/farmer/pages/FarmerListPage';
import { EmployeeListPage } from './features/employee/pages/EmployeeListPage';
import { MachineListPage } from './features/machine/pages/MachineListPage';
import { TractorListPage } from './features/machine/pages/TractorListPage';
import { HarvesterListPage } from './features/machine/pages/HarvesterListPage';
import { RentedOwnerSettlementLedgerPage } from './features/machine-owner/pages/RentedOwnerSettlementLedgerPage';
import { VehicleCompliancePage } from './features/machine/pages/VehicleCompliancePage';
import { MastersManagementPage } from './features/masters/pages/MastersManagementPage';
import { OperationsDashboardPage } from './features/operations/pages/OperationsDashboardPage';
import { BookingListPage } from './features/operations/pages/BookingListPage';
import { FuelDashboardPage } from './features/fuel/pages/FuelDashboardPage';
import { FuelVoucherListPage } from './features/fuel/pages/FuelVoucherListPage';
import { WorkshopDashboardPage } from './features/maintenance/pages/WorkshopDashboardPage';
import { BreakdownListPage } from './features/maintenance/pages/BreakdownListPage';
import { MaintenanceJobListPage } from './features/maintenance/pages/MaintenanceJobListPage';
import { InventoryDashboardPage } from './features/inventory/pages/InventoryDashboardPage';
import { SparePartListPage } from './features/inventory/pages/SparePartListPage';
import { MachineHealthDashboardPage } from './features/analytics/pages/MachineHealthDashboardPage';
import { FleetAnalyticsPage } from './features/analytics/pages/FleetAnalyticsPage';
import { FinanceDashboardPage } from './features/billing/pages/FinanceDashboardPage';
import { MachineBillingLedgerPage } from './features/billing/pages/MachineBillingLedgerPage';
import { PaymentReceiptListPage } from './features/payment/pages/PaymentReceiptListPage';
import { CashBookPage } from './features/payment/pages/CashBookPage';
import { VendorBillListPage } from './features/payables/pages/VendorBillListPage';
import { PayrollDashboardPage } from './features/payables/pages/PayrollDashboardPage';
import { GeneralLedgerPage } from './features/gl/pages/GeneralLedgerPage';
import { ProfitAndLossPage } from './features/gl/pages/ProfitAndLossPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected Authenticated Routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/operations" element={<OperationsDashboardPage />} />
            <Route path="/bookings" element={<BookingListPage />} />
            <Route path="/fuel-dashboard" element={<FuelDashboardPage />} />
            <Route path="/fuel-vouchers" element={<FuelVoucherListPage />} />
            <Route path="/workshop-dashboard" element={<WorkshopDashboardPage />} />
            <Route path="/breakdowns" element={<BreakdownListPage />} />
            <Route path="/maintenance-jobs" element={<MaintenanceJobListPage />} />
            <Route path="/inventory-dashboard" element={<InventoryDashboardPage />} />
            <Route path="/spare-parts" element={<SparePartListPage />} />
            <Route path="/machine-health" element={<MachineHealthDashboardPage />} />
            <Route path="/fleet-analytics" element={<FleetAnalyticsPage />} />
            <Route path="/finance-dashboard" element={<FinanceDashboardPage />} />
            <Route path="/invoices" element={<MachineBillingLedgerPage />} />
            <Route path="/machine-billing" element={<MachineBillingLedgerPage />} />
            <Route path="/machine-billing-ledger" element={<MachineBillingLedgerPage />} />
            <Route path="/payment-receipts" element={<PaymentReceiptListPage />} />
            <Route path="/cash-book" element={<CashBookPage />} />
            <Route path="/vendor-bills" element={<VendorBillListPage />} />
            <Route path="/payroll" element={<PayrollDashboardPage />} />
            <Route path="/general-ledger" element={<GeneralLedgerPage />} />
            <Route path="/profit-loss" element={<ProfitAndLossPage />} />
            <Route path="/farmers" element={<FarmerListPage />} />
            <Route path="/employees" element={<EmployeeListPage />} />
            <Route path="/drivers" element={<EmployeeListPage />} />
            <Route path="/machines" element={<MachineListPage />} />
            <Route path="/tractors" element={<TractorListPage />} />
            <Route path="/harvesters" element={<HarvesterListPage />} />
            <Route path="/vehicle-compliance" element={<VehicleCompliancePage />} />
            <Route path="/machine-owners" element={<RentedOwnerSettlementLedgerPage />} />
            <Route path="/rented-owner-settlement" element={<RentedOwnerSettlementLedgerPage />} />
            <Route path="/masters" element={<MastersManagementPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
