import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { InsightsService, FinancialInsights } from '../core/services/insights.service';
import { BillService, Bill, BillAnalytics } from '../core/services/bill.service';
import { AccountService } from '../core/services/account.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class Analytics implements OnInit, OnDestroy {
  isBrowser: boolean;
  userName = '';
  loading = true;
  insightsLoading = true;
  insightsError = false;

  // Financial Insights
  insights: FinancialInsights | null = null;
  get savings(): number { return this.insights?.savings ?? 0; }
  get savingsNegative(): boolean { return this.savings < 0; }

  // Chart
  chartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Income', backgroundColor: 'rgba(46,125,50,0.7)', borderColor: '#2E7D32', borderWidth: 2, borderRadius: 6 },
      { data: [], label: 'Expense', backgroundColor: 'rgba(198,40,40,0.7)', borderColor: '#C62828', borderWidth: 2, borderRadius: 6 }
    ]
  };
  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 13 }, color: '#444' } },
      tooltip: { mode: 'index', intersect: false }
    },
    scales: {
      x: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { color: '#555' } },
      y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { color: '#555' } }
    }
  };

  // Legacy account/bill data
  accounts: any[] = [];
  bills: Bill[] = [];
  totalBalance = 0;
  activeAccountCount = 0;
  totalBills = 0;
  paidBills = 0;
  pendingBills = 0;
  overdueBills = 0;
  billsPaidTotal = 0;
  billsPendingTotal = 0;
  billsOverdueTotal = 0;
  savingsCount = 0;
  currentCount = 0;

  private refreshTimer: any;

  constructor(
    private insightsService: InsightsService,
    private billService: BillService,
    private accountService: AccountService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;
    this.userName = sessionStorage.getItem('userName') || 'Customer';
    this.loadInsights();
    this.loadAccountsBills();
  }

  ngOnDestroy() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  get userInitials(): string {
    return this.userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  }

  loadInsights() {
    this.insightsLoading = true;
    this.insightsError = false;
    this.insightsService.getMyInsights().subscribe({
      next: (data) => {
        this.insights = data;
        this.buildChart(data);
        this.insightsLoading = false;
      },
      error: () => {
        this.insightsError = true;
        this.insightsLoading = false;
      }
    });
  }

  buildChart(data: FinancialInsights) {
    this.chartData = {
      labels: data.trendSummary.map(e => e.month),
      datasets: [
        {
          data: data.trendSummary.map(e => e.totalIncome),
          label: 'Income',
          backgroundColor: 'rgba(46,125,50,0.7)',
          borderColor: '#2E7D32',
          borderWidth: 2,
          borderRadius: 6
        } as any,
        {
          data: data.trendSummary.map(e => e.totalExpense),
          label: 'Expense',
          backgroundColor: 'rgba(198,40,40,0.7)',
          borderColor: '#C62828',
          borderWidth: 2,
          borderRadius: 6
        } as any
      ]
    };
  }

  loadAccountsBills() {
    this.loading = true;
    forkJoin({
      accounts: this.accountService.getAccounts(),
      bills: this.billService.getBills()
    }).subscribe({
      next: (result) => {
        this.accounts = result.accounts;
        const now = new Date();
        this.bills = result.bills.map((b: Bill) => {
          if (b.status === 'PENDING' && new Date(b.dueDate) < now) return { ...b, status: 'OVERDUE' as const };
          return b;
        });
        this.compute();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  compute() {
    this.totalBalance = this.accounts.reduce((s: number, a: any) => s + (a.balance || 0), 0);
    this.activeAccountCount = this.accounts.filter((a: any) => a.status === 'ACTIVE' || !a.status).length;
    this.savingsCount = this.accounts.filter((a: any) => a.accountType === 'SAVINGS').length;
    this.currentCount = this.accounts.filter((a: any) => a.accountType === 'CURRENT').length;
    this.totalBills = this.bills.length;
    this.paidBills = this.bills.filter((b: Bill) => b.status === 'PAID').length;
    this.pendingBills = this.bills.filter((b: Bill) => b.status === 'PENDING').length;
    this.overdueBills = this.bills.filter((b: Bill) => b.status === 'OVERDUE').length;
    this.billsPaidTotal = this.bills.filter((b: Bill) => b.status === 'PAID').reduce((s: number, b: Bill) => s + b.amount, 0);
    this.billsPendingTotal = this.bills.filter((b: Bill) => b.status === 'PENDING').reduce((s: number, b: Bill) => s + b.amount, 0);
    this.billsOverdueTotal = this.bills.filter((b: Bill) => b.status === 'OVERDUE').reduce((s: number, b: Bill) => s + b.amount, 0);
  }
}
