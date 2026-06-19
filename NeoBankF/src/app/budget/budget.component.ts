import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { BudgetService, BudgetCategory, BudgetAlert } from '../core/services/budget.service';
import { AccountService } from '../core/services/account.service';
import { ToastService } from '../core/services/toast.service';

Chart.register(...registerables);

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './budget.component.html',
  styleUrls: ['./budget.component.css']
})
export class BudgetComponent implements OnInit, OnDestroy {

  activeTab: 'overview' | 'budgets' | 'create' | 'analytics' = 'overview';
  sidebarCollapsed = false;
  userName = '';
  budgets: BudgetCategory[] = [];
  alerts: BudgetAlert[] = [];
  accounts: any[] = [];

  // Create form
  newBudget = { name: '', icon: 'category', color: '#4f46e5', limit: 1000, period: 'MONTHLY' as 'MONTHLY' | 'WEEKLY' };
  editingBudgetId: string | null = null;
  editLimit = 0;

  // Messages
  successMessage = '';
  errorMessage = '';

  // Charts
  private doughnutChart: Chart | null = null;
  private barChart: Chart | null = null;
  private sub: Subscription | null = null;
  private isBrowser: boolean;

  iconOptions = [
    'restaurant', 'directions_car', 'shopping_bag', 'movie', 'bolt',
    'fitness_center', 'school', 'flight', 'pets', 'home',
    'local_hospital', 'sports_esports', 'music_note', 'coffee', 'more_horiz'
  ];

  colorOptions = ['#e65100', '#4338ca', '#7b1fa2', '#c62828', '#2e7d32', '#00838f', '#4527a0', '#546e7a', '#d84315', '#4f46e5'];

  Math = Math;

  constructor(
    private router: Router,
    private budgetService: BudgetService,
    private accountService: AccountService,
    private toast: ToastService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;
    this.userName = sessionStorage.getItem('userName') || 'Customer';
    this.accountService.getAccounts().subscribe({ next: (a: any[]) => this.accounts = a, error: () => {} });
    this.startPolling();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.doughnutChart?.destroy();
    this.barChart?.destroy();
  }

  get userInitials(): string {
    return this.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  get totalBudget(): number { return this.budgets.reduce((s, b) => s + b.limit, 0); }
  get totalSpent(): number { return this.budgets.reduce((s, b) => s + b.spent, 0); }
  get totalRemaining(): number { return this.totalBudget - this.totalSpent; }
  get overallPercentage(): number { return this.totalBudget > 0 ? Math.round((this.totalSpent / this.totalBudget) * 100) : 0; }
  get exceededCount(): number { return this.budgets.filter(b => b.spent > b.limit).length; }
  get warningCount(): number { return this.budgets.filter(b => b.spent >= b.limit * 0.8 && b.spent <= b.limit).length; }

  startPolling() {
    this.sub = this.budgetService.getBudgetsRealTime().subscribe({
      next: (budgets: BudgetCategory[]) => {
        this.budgets = budgets;
        this.alerts = this.budgetService.getAlerts();
        if (this.activeTab === 'analytics') setTimeout(() => this.renderCharts(), 200);
      },
      error: () => {
        // Fallback to stored budgets
        this.budgets = this.budgetService['budgetsSubject'].value;
      }
    });
  }

  switchTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    this.clearMessages();
    if (tab === 'analytics') setTimeout(() => this.renderCharts(), 200);
  }

  clearMessages() { this.successMessage = ''; this.errorMessage = ''; }

  getPercentage(b: BudgetCategory): number {
    return b.limit > 0 ? Math.min(100, Math.round((b.spent / b.limit) * 100)) : 0;
  }

  getStatusColor(b: BudgetCategory): string {
    const pct = this.getPercentage(b);
    if (pct >= 100) return '#dc2626';
    if (pct >= 80) return '#f59e0b';
    return '#22c55e';
  }

  getStatusLabel(b: BudgetCategory): string {
    const pct = this.getPercentage(b);
    if (pct >= 100) return 'Exceeded';
    if (pct >= 80) return 'Warning';
    if (pct >= 50) return 'On Track';
    return 'Good';
  }

  // CRUD
  createBudget() {
    if (!this.newBudget.name.trim()) {
      this.errorMessage = 'Category name is required';
      this.toast.warning('Missing name', 'Please enter a budget category name.');
      return;
    }
    if (this.newBudget.limit <= 0) {
      this.errorMessage = 'Budget limit must be greater than 0';
      this.toast.warning('Invalid limit', 'Budget limit must be greater than 0.');
      return;
    }
    this.budgetService.addBudget(this.newBudget).subscribe({
      next: created => {
        this.successMessage = `Budget "${created.name}" created!`;
        this.toast.success('Budget created', created.name + ' â€” limit â‚¹' + created.limit.toLocaleString('en-IN'));
        this.newBudget = { name: '', icon: 'category', color: '#4f46e5', limit: 1000, period: 'MONTHLY' };
        this.budgets = this.budgetService['budgetsSubject'].value;
      },
      error: err => {
        const reason = this.toast.fromHttpError(err, 'Failed to create budget');
        this.errorMessage = reason;
        this.toast.error('Could not create budget', reason);
      }
    });
  }

  startEdit(b: BudgetCategory) {
    this.editingBudgetId = b.id;
    this.editLimit = b.limit;
  }

  saveEdit(b: BudgetCategory) {
    this.budgetService.updateBudget(b.id, { limit: this.editLimit }).subscribe({
      next: () => {
        this.editingBudgetId = null;
        this.budgets = this.budgetService['budgetsSubject'].value;
        this.successMessage = `Budget "${b.name}" updated!`;
        this.toast.success('Budget updated', b.name + ' â€” new limit â‚¹' + this.editLimit.toLocaleString('en-IN'));
      },
      error: err => {
        const reason = this.toast.fromHttpError(err, 'Failed to update budget');
        this.errorMessage = reason;
        this.toast.error('Update failed', reason);
      }
    });
  }

  cancelEdit() { this.editingBudgetId = null; }

  deleteBudget(b: BudgetCategory) {
    if (!confirm(`Delete budget "${b.name}"?`)) return;
    this.budgetService.deleteBudget(b.id).subscribe({
      next: () => {
        this.budgets = this.budgetService['budgetsSubject'].value;
        this.successMessage = `Budget "${b.name}" deleted.`;
        this.toast.success('Budget deleted', b.name + ' has been removed.');
      },
      error: err => {
        const reason = this.toast.fromHttpError(err, 'Failed to delete budget');
        this.errorMessage = reason;
        this.toast.error('Delete failed', reason);
      }
    });
  }

  resetAll() {
    if (!confirm('Reset all spending to 0?')) return;
    this.budgetService.resetMonthlyBudgets();
    this.budgets = this.budgetService['budgetsSubject'].value;
    this.successMessage = 'All budgets reset!';
    this.toast.info('Budgets reset', 'All spending counters set back to 0.');
  }

  // Charts
  renderCharts() {
    this.renderDoughnut();
    this.renderBar();
  }

  renderDoughnut() {
    if (typeof document === 'undefined') return;
    if (this.doughnutChart) this.doughnutChart.destroy();
    const canvas = document.getElementById('budgetDoughnut') as HTMLCanvasElement;
    if (!canvas) return;
    this.doughnutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: this.budgets.map(b => b.name),
        datasets: [{
          data: this.budgets.map(b => b.spent),
          backgroundColor: this.budgets.map(b => b.color),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, font: { size: 12 } } }
        }
      }
    });
  }

  renderBar() {
    if (typeof document === 'undefined') return;
    if (this.barChart) this.barChart.destroy();
    const canvas = document.getElementById('budgetBar') as HTMLCanvasElement;
    if (!canvas) return;
    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: this.budgets.map(b => b.name),
        datasets: [
          { label: 'Budget', data: this.budgets.map(b => b.limit), backgroundColor: 'rgba(79, 70, 229,0.15)', borderColor: '#4f46e5', borderWidth: 1 },
          { label: 'Spent', data: this.budgets.map(b => b.spent), backgroundColor: this.budgets.map(b => b.spent > b.limit ? 'rgba(220,38,38,0.7)' : 'rgba(34,197,94,0.7)'), borderWidth: 0 }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, ticks: { callback: v => 'Rs.' + v }, grid: { color: 'rgba(0,0,0,0.04)' } },
          x: { grid: { display: false } }
        },
        plugins: { legend: { position: 'top' } }
      }
    });
  }

  logout() {
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
