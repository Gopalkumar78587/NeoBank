import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, UserAdmin, SystemHealth } from '../../core/services/admin.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  isBrowser: boolean;
  loading = true;
  error = false;
  successMsg = '';
  errorMsg = '';

  users: UserAdmin[] = [];
  totalElements = 0;
  totalPages = 0;
  page = 0;
  size = 20;
  searchQuery = '';

  systemHealth: SystemHealth | null = null;
  healthLoading = true;

  confirmDialog: { user: UserAdmin; newState: boolean } | null = null;

  constructor(
    private adminService: AdminService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    if (!this.isBrowser) return;
    this.loadUsers();
    this.loadHealth();
  }

  loadUsers() {
    this.loading = true;
    this.adminService.getUsers(this.page, this.size).subscribe({
      next: (res: any) => {
        this.users = res.content ?? res;
        this.totalElements = res.totalElements ?? this.users.length;
        this.totalPages = res.totalPages ?? 1;
        this.loading = false;
      },
      error: () => { this.error = true; this.loading = false; }
    });
  }

  loadHealth() {
    this.healthLoading = true;
    this.adminService.getSystemHealth().subscribe({
      next: (h) => { this.systemHealth = h; this.healthLoading = false; },
      error: () => this.healthLoading = false
    });
  }

  get filteredUsers(): UserAdmin[] {
    if (!this.searchQuery.trim()) return this.users;
    const q = this.searchQuery.toLowerCase();
    return this.users.filter(u =>
      u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }

  openConfirm(user: UserAdmin, newState: boolean) {
    this.confirmDialog = { user, newState };
  }

  cancelConfirm() { this.confirmDialog = null; }

  confirmToggle() {
    if (!this.confirmDialog) return;
    const { user, newState } = this.confirmDialog;
    this.confirmDialog = null;
    this.adminService.updateUserStatus(user.id, newState).subscribe({
      next: () => {
        user.active = newState;
        this.successMsg = `User "${user.fullName}" ${newState ? 'activated' : 'deactivated'} successfully.`;
        setTimeout(() => this.successMsg = '', 4000);
      },
      error: (err: any) => {
        this.errorMsg = err?.error?.error || 'Failed to update user status.';
        setTimeout(() => this.errorMsg = '', 4000);
      }
    });
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  prevPage() { if (this.page > 0) { this.page--; this.loadUsers(); } }
  nextPage() { if (this.page < this.totalPages - 1) { this.page++; this.loadUsers(); } }
}
