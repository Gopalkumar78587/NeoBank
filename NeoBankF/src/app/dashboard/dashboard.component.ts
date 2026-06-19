import { Component, OnInit } from '@angular/core';
import { AccountService } from '../core/services/account.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterModule      // ✅ REQUIRED
  ],

  standalone: true,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  totalBalance = 0;
  accountCount = 0;

  constructor(
    private accountService: AccountService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.accountService.getAccounts().subscribe(accounts => {
      this.accountCount = accounts.length;
      this.totalBalance = accounts
        .map(a => a.balance)
        .reduce((a, b) => a + b, 0);
    });
  }

  logout() {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}