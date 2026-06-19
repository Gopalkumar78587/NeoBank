import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { RewardService, RewardSummary, RewardTier, RewardTransaction } from '../core/services/reward.service';

Chart.register(...registerables);

@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './rewards.component.html',
  styleUrls: ['./rewards.component.css']
})
export class RewardsComponent implements OnInit, OnDestroy {

  activeTab: 'overview' | 'history' | 'redeem' | 'tiers' = 'overview';
  sidebarCollapsed = false;
  userName = '';

  summary: RewardSummary | null = null;
  allTiers: RewardTier[] = [];
  nextTier: RewardTier | null = null;
  progressToNext = 0;

  // Redeem
  redeemPoints = 0;
  redeemDescription = '';
  redeemOptions = [
    { name: 'Cashback Rs.100', points: 500, icon: 'payments', desc: 'Get Rs.100 credited to your account' },
    { name: 'Cashback Rs.500', points: 2000, icon: 'account_balance_wallet', desc: 'Get Rs.500 credited to your account' },
    { name: 'Amazon Voucher', points: 3000, icon: 'card_giftcard', desc: 'Rs.300 Amazon gift card' },
    { name: 'Movie Tickets', points: 1500, icon: 'movie', desc: '2 movie tickets at any PVR' },
    { name: 'Free Transfer', points: 200, icon: 'swap_horiz', desc: '10 free fund transfers' },
    { name: 'Premium 1 Month', points: 5000, icon: 'diamond', desc: '1 month premium membership' },
  ];

  // Messages
  successMessage = '';
  errorMessage = '';

  // Charts
  private lineChart: Chart | null = null;
  private pieChart: Chart | null = null;
  private sub: Subscription | null = null;
  private isBrowser: boolean;

  Math = Math;

  constructor(
    private router: Router,
    private rewardService: RewardService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;
    this.userName = sessionStorage.getItem('userName') || 'Customer';
    this.allTiers = this.rewardService.getAllTiers();
    this.startPolling();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.lineChart?.destroy();
    this.pieChart?.destroy();
  }

  get userInitials(): string {
    return this.userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  get earnedHistory(): RewardTransaction[] {
    return this.summary?.history.filter((h: RewardTransaction) => h.type === 'EARNED') || [];
  }

  get redeemedHistory(): RewardTransaction[] {
    return this.summary?.history.filter((h: RewardTransaction) => h.type === 'REDEEMED') || [];
  }

  startPolling() {
    this.sub = this.rewardService.getSummaryRealTime().subscribe({
      next: (summary: RewardSummary) => {
        this.summary = summary;
        this.nextTier = this.rewardService.getNextTier();
        this.progressToNext = this.rewardService.getProgressToNextTier();
        if (this.activeTab === 'overview') setTimeout(() => this.renderCharts(), 200);
      },
      error: () => {}
    });
  }

  switchTab(tab: typeof this.activeTab) {
    this.activeTab = tab;
    this.clearMessages();
    if (tab === 'overview') setTimeout(() => this.renderCharts(), 200);
  }

  clearMessages() { this.successMessage = ''; this.errorMessage = ''; }

  redeemReward(option: any) {
    if (!this.summary || this.summary.availablePoints < option.points) {
      this.errorMessage = `Not enough points. You need ${option.points} but have ${this.summary?.availablePoints || 0}.`;
      return;
    }
    if (!confirm(`Redeem ${option.points} points for "${option.name}"?`)) return;
    const ok = this.rewardService.redeemPoints(option.points, option.name);
    if (ok) {
      this.successMessage = `ðŸŽ‰ Redeemed ${option.points} points for "${option.name}"!`;
    } else {
      this.errorMessage = 'Redemption failed. Not enough points.';
    }
  }

  redeemCustom() {
    if (this.redeemPoints <= 0) { this.errorMessage = 'Enter valid points'; return; }
    if (!this.redeemDescription.trim()) { this.errorMessage = 'Enter description'; return; }
    const ok = this.rewardService.redeemPoints(this.redeemPoints, this.redeemDescription);
    if (ok) {
      this.successMessage = `Redeemed ${this.redeemPoints} points!`;
      this.redeemPoints = 0;
      this.redeemDescription = '';
    } else {
      this.errorMessage = 'Not enough points.';
    }
  }

  renderCharts() {
    this.renderEarningsLine();
    this.renderCategoryPie();
  }

  renderEarningsLine() {
    if (typeof document === 'undefined' || !this.summary) return;
    if (this.lineChart) this.lineChart.destroy();
    const canvas = document.getElementById('earningsLine') as HTMLCanvasElement;
    if (!canvas) return;

    // Group by date
    const dailyMap = new Map<string, number>();
    this.summary.history.filter((h: RewardTransaction) => h.type === 'EARNED').forEach((h: RewardTransaction) => {
      const day = new Date(h.timestamp).toLocaleDateString();
      dailyMap.set(day, (dailyMap.get(day) || 0) + h.pointsEarned);
    });
    const entries = Array.from(dailyMap.entries()).slice(-14);

    this.lineChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: entries.map(e => e[0]),
        datasets: [{
          label: 'Points Earned',
          data: entries.map(e => e[1]),
          borderColor: '#ffd700',
          backgroundColor: 'rgba(255,215,0,0.1)',
          fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: '#ffd700', borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  renderCategoryPie() {
    if (typeof document === 'undefined' || !this.summary) return;
    if (this.pieChart) this.pieChart.destroy();
    const canvas = document.getElementById('categoryPie') as HTMLCanvasElement;
    if (!canvas) return;

    const catMap = new Map<string, number>();
    this.summary.history.filter((h: RewardTransaction) => h.type === 'EARNED').forEach((h: RewardTransaction) => {
      catMap.set(h.category, (catMap.get(h.category) || 0) + h.pointsEarned);
    });

    const colors = ['#4f46e5', '#e65100', '#2e7d32', '#7b1fa2', '#c62828', '#00838f'];

    this.pieChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: Array.from(catMap.keys()),
        datasets: [{
          data: Array.from(catMap.values()),
          backgroundColor: colors.slice(0, catMap.size),
          borderWidth: 2, borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } } }
      }
    });
  }

  logout() {
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
