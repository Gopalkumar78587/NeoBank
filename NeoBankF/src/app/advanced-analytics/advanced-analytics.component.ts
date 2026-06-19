import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import {
  UserAnalyticsService, SpendingAnalytics, WealthAnalytics
} from '../core/services/user-analytics.service';

@Component({
  selector: 'app-advanced-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective],
  templateUrl: './advanced-analytics.component.html',
  styleUrls: ['./advanced-analytics.component.css']
})
export class AdvancedAnalyticsComponent implements OnInit {

  activeTab: 'spending' | 'wealth' = 'spending';

  spending: SpendingAnalytics | null = null;
  wealth: WealthAnalytics | null = null;

  spendingLoading = false;
  wealthLoading = false;

  // Spending â€” month selector
  availableMonths: string[] = [];
  selectedMonth = '';

  // Charts
  doughnutData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };

  stackedBarData: ChartData<'bar'> = { labels: [], datasets: [] };
  stackedBarOptions: ChartOptions<'bar'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { x: { stacked: true }, y: { stacked: false, beginAtZero: true } }
  };

  netWorthData: ChartData<'line'> = { labels: [], datasets: [] };
  netWorthOptions: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: false } }
  };

  rewardsData: ChartData<'line'> = { labels: [], datasets: [] };
  rewardsOptions: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  constructor(private svc: UserAnalyticsService) {}

  ngOnInit(): void {
    this.loadSpending();
    this.loadWealth();
  }

  loadSpending() {
    this.spendingLoading = true;
    this.svc.getSpending(6).subscribe({
      next: (data) => {
        this.spending = data;

        // Months union from any category vector
        const monthSet = new Set<string>();
        data.categorySpending.forEach(c => c.monthly.forEach(m => monthSet.add(m.month)));
        this.availableMonths = Array.from(monthSet).sort();
        this.selectedMonth   = this.availableMonths[this.availableMonths.length - 1] || '';

        this.rebuildDoughnut();
        this.rebuildStackedBar();
        this.spendingLoading = false;
      },
      error: () => { this.spendingLoading = false; }
    });
  }

  loadWealth() {
    this.wealthLoading = true;
    this.svc.getWealth().subscribe({
      next: (data) => {
        this.wealth = data;

        this.netWorthData = {
          labels: data.netWorthTimeline.map(p => p.month),
          datasets: [
            {
              label: 'Total Balance', data: data.netWorthTimeline.map(p => p.totalBalance),
              borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229,.20)', fill: true, tension: 0.35
            },
            {
              label: 'Outstanding Loan', data: data.netWorthTimeline.map(p => p.outstandingPrincipal),
              borderColor: '#e53935', backgroundColor: 'rgba(229,57,53,.18)', fill: true, tension: 0.35
            },
            {
              label: 'Net Worth', data: data.netWorthTimeline.map(p => p.netWorth),
              borderColor: '#43a047', backgroundColor: 'rgba(67,160,71,.10)', fill: false, tension: 0.35,
              borderWidth: 3, borderDash: [6,4]
            }
          ]
        };

        this.rewardsData = {
          labels: data.rewardAccrualHistory.map(r => r.month),
          datasets: [{
            data: data.rewardAccrualHistory.map(r => r.points),
            borderColor: '#8e24aa', backgroundColor: 'rgba(142,36,170,.15)',
            fill: true, tension: 0.35, pointRadius: 4
          }]
        };

        this.wealthLoading = false;
      },
      error: () => { this.wealthLoading = false; }
    });
  }

  rebuildDoughnut() {
    if (!this.spending || !this.selectedMonth) return;
    const palette = ['#4f46e5','#43a047','#e53935','#fb8c00','#8e24aa','#00897b','#5d4037'];
    const slices = this.spending.categorySpending
      .map(c => ({
        cat: c.category,
        amt: c.monthly.find(m => m.month === this.selectedMonth)?.amount ?? 0
      }))
      .filter(s => s.amt > 0);

    this.doughnutData = {
      labels: slices.map(s => s.cat),
      datasets: [{ data: slices.map(s => s.amt), backgroundColor: palette.slice(0, slices.length) }]
    };
  }

  rebuildStackedBar() {
    if (!this.spending) return;
    const palette = ['#4f46e5','#43a047','#e53935','#fb8c00','#8e24aa','#00897b','#5d4037'];
    const months  = this.availableMonths;

    const datasets = this.spending.categorySpending
      .filter(c => c.totalSpent > 0 || c.budgetLimit > 0)
      .map((c, i) => ({
        label: c.category,
        data: months.map(m => c.monthly.find(x => x.month === m)?.amount ?? 0),
        backgroundColor: palette[i % palette.length]
      }));

    this.stackedBarData = { labels: months, datasets };
  }

  onMonthChange() { this.rebuildDoughnut(); }
}
