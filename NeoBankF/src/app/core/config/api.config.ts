import { environment } from '../../../environments/environment';

const root = environment.apiUrl;

export const API = {
  auth: {
    login: `${root}/auth/login`,
    register: `${root}/auth/register`,
  },
  customer: {
    profile: `${root}/customer/profile`,
    accounts: `${root}/customer/accounts`,
    bills: `${root}/customer/bills`,
    budgets: `${root}/customer/budgets`,
    otp: `${root}/customer/otp`,
    analytics: `${root}/customer/analytics`,
  },
  admin: {
    root: `${root}/admin`,
    accounts: `${root}/admin/accounts`,
    dashboard: `${root}/admin/dashboard`,
    pendingApprovals: `${root}/admin/pending-approvals`,
    systemHealth: `${root}/admin/system-health`,
    users: `${root}/admin/users`,
    userStatus: (id: number) => `${root}/admin/users/${id}/status`,
    userActivity: (id: number) => `${root}/admin/users/${id}/activity`,
    // Sprint 5
    txnAnalytics: (timeframe: string) => `${root}/admin/analytics/transactions?timeframe=${timeframe}`,
    loanAnalytics: (timeframe: string) => `${root}/admin/analytics/loans?timeframe=${timeframe}`,
    systemLogs: `${root}/admin/system-logs`,
    systemLogsHealth: `${root}/admin/system-logs/health`,
  },
  insights: {
    me: `${root}/insights/me`,
    byId: (userId: number) => `${root}/insights/${userId}`,
  },
  // Sprint 5 — FR-8 user analytics
  analytics: {
    spendingMe: (months: number) => `${root}/analytics/spending/me?months=${months}`,
    wealthMe:   `${root}/analytics/wealth/me`,
    spending: (userId: number, months: number) => `${root}/analytics/spending/${userId}?months=${months}`,
    wealth:   (userId: number) => `${root}/analytics/wealth/${userId}`,
  },
  loans: {
    products: `${root}/loans/products`,
    apply: `${root}/loans/apply`,
    myApplications: `${root}/loans/my-applications`,
    myAccounts: `${root}/loans/my-accounts`,
    adminApplications: `${root}/loans/admin/applications`,
    decision: (id: number) => `${root}/loans/${id}/decision`,
    repayments: (loanAccountId: number) => `${root}/loans/${loanAccountId}/repayments`,
    payInstalment: (loanAccountId: number, repaymentId: number) =>
      `${root}/loans/${loanAccountId}/repayments/${repaymentId}/pay`,
  },
  user: {
    me: `${root}/users/me`,
  },
} as const;

export const POLL_INTERVAL_MS = environment.pollIntervalMs;
