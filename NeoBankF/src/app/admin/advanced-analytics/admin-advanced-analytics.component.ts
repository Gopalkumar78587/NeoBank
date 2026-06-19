import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import { AdminAnalyticsService, AdminTxnAnalytics, AdminLoanAnalytics } from '../../core/services/admin-analytics.service';

type Tf = '7d' | '30d' | 'YTD';

@Component({
  selector: 'app-admin-advanced-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective],
  templateUrl: './admin-advanced-analytics.component.html',
  styleUrls: ['./admin-advanced-analytics.component.css']
})
export class AdminAdvancedAnalyticsComponent implements OnInit {

  timeframe: Tf = '30d';
  loading = false;
  error = '';

  txn: AdminTxnAnalytics | null = null;
  loans: AdminLoanAnalytics | null = null;

  // ── Chart bindings ─────────────────────────────────────────────────────
  txnLineData: ChartData<'line'> = { labels: [], datasets: [] };
  txnLineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
    scales: { x: { grid: { color: 'rgba(0,0,0,.05)' } }, y: { beginAtZero: true } }
  };

  loanBarData: ChartData<'bar'> = { labels: [], datasets: [] };
  loanBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } }
  };

  statusDistData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  statusDistOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } }
  };

  constructor(private svc: AdminAnalyticsService) {}

  ngOnInit(): void { this.load(); }

  changeTimeframe(tf: Tf) {
    if (tf === this.timeframe) return;
    this.timeframe = tf;
    this.load();
  }

  load() {
    this.loading = true;
    this.error = '';

    this.svc.getTransactionAnalytics(this.timeframe).subscribe({
      next: (data) => {
        this.txn = data;
        this.txnLineData = {
          labels: data.dailyVolumes.map(d => d.date),
          datasets: [
            {
              label: 'Inflow',
              data: data.dailyVolumes.map(d => d.inflow),
              borderColor: '#2E7D32',
              backgroundColor: 'rgba(46,125,50,.18)',
              fill: true, tension: 0.35, pointRadius: 3
            },
            {
              label: 'Outflow',
              data: data.dailyVolumes.map(d => d.outflow),
              borderColor: '#C62828',
              backgroundColor: 'rgba(198,40,40,.18)',
              fill: true, tension: 0.35, pointRadius: 3
            }
          ]
        };
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.error || 'Failed to load transaction analytics';
        this.loading = false;
      }
    });

    this.svc.getLoanAnalytics(this.timeframe).subscribe({
      next: (data) => {
        this.loans = data;
        const dist = data.distributionByStatus || {};
        const colors = ['#FFA000', '#43A047', '#E53935'];
        this.statusDistData = {
          labels: Object.keys(dist),
          datasets: [{ data: Object.values(dist), backgroundColor: colors }]
        };

        this.loanBarData = {
          labels: data.byProduct.map(p => p.productName),
          datasets: [
            { label: 'Pending',  data: data.byProduct.map(p => p.pending),  backgroundColor: '#FFA000' },
            { label: 'Approved', data: data.byProduct.map(p => p.approved), backgroundColor: '#43A047' },
            { label: 'Rejected', data: data.byProduct.map(p => p.rejected), backgroundColor: '#E53935' }
          ]
        };
      },
      error: () => { /* keep txn data */ }
    });
  }
}
