import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import {
  AdminAnalyticsService, SystemAuditLog, SystemLogsHealth
} from '../../core/services/admin-analytics.service';

@Component({
  selector: 'app-system-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective],
  templateUrl: './system-logs.component.html',
  styleUrls: ['./system-logs.component.css']
})
export class SystemLogsComponent implements OnInit {

  logs: SystemAuditLog[] = [];
  filtered: SystemAuditLog[] = [];
  health: SystemLogsHealth | null = null;

  page = 0;
  size = 20;
  totalPages = 0;
  totalElements = 0;

  search = '';
  statusFilter: '' | '2xx' | '4xx' | '5xx' = '';
  loading = false;

  errorRateData: ChartData<'line'> = { labels: [], datasets: [] };
  errorRateOptions: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } }
  };

  rtData: ChartData<'line'> = { labels: [], datasets: [] };
  rtOptions: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { callback: v => v + ' ms' } } }
  };

  constructor(private svc: AdminAnalyticsService) {}

  ngOnInit(): void {
    this.loadLogs();
    this.loadHealth();
  }

  loadLogs() {
    this.loading = true;
    this.svc.getSystemLogs({ page: this.page, size: this.size }).subscribe({
      next: (resp) => {
        this.logs = resp.content;
        this.totalElements = resp.totalElements;
        this.totalPages    = resp.totalPages;
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  loadHealth() {
    this.svc.getSystemLogsHealth().subscribe({
      next: (h) => {
        this.health = h;
        this.errorRateData = {
          labels: h.hourlyErrors.map(b => b.hour + ':00'),
          datasets: [{
            data: h.hourlyErrors.map(b => b.total === 0 ? 0 : +((b.errors / b.total) * 100).toFixed(2)),
            borderColor: '#e53935',
            backgroundColor: 'rgba(229,57,53,.15)',
            fill: true, tension: 0.35
          }]
        };
        this.rtData = {
          labels: h.hourlyResponse.map(b => b.hour + ':00'),
          datasets: [{
            data: h.hourlyResponse.map(b => +b.avgMs.toFixed(1)),
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229,.15)',
            fill: true, tension: 0.35
          }]
        };
      }
    });
  }

  applyFilters() {
    const q = this.search.trim().toLowerCase();
    this.filtered = this.logs.filter(l => {
      if (q && !(l.endpoint.toLowerCase().includes(q)
            || (l.errorMessage || '').toLowerCase().includes(q))) return false;
      if (this.statusFilter === '2xx' && !(l.responseStatus >= 200 && l.responseStatus < 300)) return false;
      if (this.statusFilter === '4xx' && !(l.responseStatus >= 400 && l.responseStatus < 500)) return false;
      if (this.statusFilter === '5xx' && !(l.responseStatus >= 500)) return false;
      return true;
    });
  }

  statusClass(s: number): string {
    if (s >= 500) return 'pill red';
    if (s >= 400) return 'pill amber';
    if (s >= 300) return 'pill blue';
    return 'pill green';
  }

  prev() { if (this.page > 0)            { this.page--; this.loadLogs(); } }
  next() { if (this.page < this.totalPages - 1) { this.page++; this.loadLogs(); } }
}
