import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { LandingComponent } from './landing/landing.component';
import { roleGuard } from './core/guards/auth-guard';

import { AdminLayoutComponent } from './core/layouts/admin-layout/admin-layout.component';
import { CustomerLayoutComponent } from './core/layouts/customer-layout/customer-layout.component';

import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { LoanProductsAdminComponent } from './admin/loan-products/loan-products.component';
import { LoanDecisionsComponent } from './admin/loan-decisions/loan-decisions.component';
import { AdminLoanDashboardComponent } from './admin/loan-dashboard/admin-loan-dashboard.component';
import { PendingApprovalsComponent } from './admin/pending-approvals/pending-approvals.component';
import { UserManagementComponent } from './admin/user-management/user-management.component';
import { AdminAdvancedAnalyticsComponent } from './admin/advanced-analytics/admin-advanced-analytics.component';
import { SystemLogsComponent } from './admin/system-logs/system-logs.component';

import { CustomerDashboardComponent } from './customer/customer-dashboard/customer-dashboard.component';
import { BillsComponent } from './bills/bills.component';
import { TransactionsComponent } from './transaction/transactions/transactions.component';
import { Analytics } from './analytics/analytics.component';
import { BudgetComponent } from './budget/budget.component';
import { RewardsComponent } from './rewards/rewards.component';
import { LoanApplyComponent } from './loans/loan-apply/loan-apply.component';
import { MyLoansComponent } from './loans/my-loans/my-loans.component';
import { RepaymentScheduleComponent } from './loans/repayment-schedule/repayment-schedule.component';
import { LoanDashboardComponent } from './loans/loan-dashboard/loan-dashboard.component';
import { AdvancedAnalyticsComponent } from './advanced-analytics/advanced-analytics.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // ───────── ADMIN SHELL ─────────
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [roleGuard('ADMIN')],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'loan-dashboard', component: AdminLoanDashboardComponent },
      { path: 'loan-products', component: LoanProductsAdminComponent },
      { path: 'loan-decisions', component: LoanDecisionsComponent },
      { path: 'pending-approvals', component: PendingApprovalsComponent },
      { path: 'user-management', component: UserManagementComponent },
      { path: 'advanced-analytics', component: AdminAdvancedAnalyticsComponent },
      { path: 'system-logs', component: SystemLogsComponent },
    ],
  },

  // ───────── CUSTOMER SHELL ─────────
  {
    path: '',
    component: CustomerLayoutComponent,
    canActivate: [roleGuard('CUSTOMER')],
    children: [
      { path: 'customer/dashboard', component: CustomerDashboardComponent },
      { path: 'transactions', component: TransactionsComponent },
      { path: 'bills', component: BillsComponent },
      { path: 'analytics', component: Analytics },
      { path: 'budget', component: BudgetComponent },
      { path: 'rewards', component: RewardsComponent },
      { path: 'loans/apply', component: LoanApplyComponent },
      { path: 'loans/my-loans', component: MyLoansComponent },
      { path: 'loans/repayments/:id', component: RepaymentScheduleComponent },
      { path: 'loans/dashboard', component: LoanDashboardComponent },
      { path: 'advanced-analytics', component: AdvancedAnalyticsComponent },
    ],
  },
];
