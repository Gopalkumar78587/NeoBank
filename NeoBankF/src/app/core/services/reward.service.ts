import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, startWith, switchMap, of, map } from 'rxjs';
import { AccountService } from './account.service';
import { TransactionService } from './transaction.service';

export interface RewardTier {
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  icon: string;
  multiplier: number;
  perks: string[];
}

export interface RewardTransaction {
  id: string;
  description: string;
  amount: number;
  pointsEarned: number;
  type: 'EARNED' | 'REDEEMED' | 'BONUS' | 'EXPIRED';
  category: string;
  timestamp: string;
}

export interface RewardSummary {
  totalPoints: number;
  availablePoints: number;
  redeemedPoints: number;
  tier: RewardTier;
  lifetimeEarned: number;
  thisMonthEarned: number;
  streak: number;
  history: RewardTransaction[];
}

@Injectable({ providedIn: 'root' })
export class RewardService {

  private STORAGE_KEY = 'neobank_rewards';

  private tiers: RewardTier[] = [
    { name: 'Bronze', minPoints: 0, maxPoints: 999, color: '#cd7f32', icon: 'military_tech', multiplier: 1, perks: ['1 point per Rs.100 spent', 'Basic cashback offers'] },
    { name: 'Silver', minPoints: 1000, maxPoints: 4999, color: '#9e9e9e', icon: 'workspace_premium', multiplier: 1.5, perks: ['1.5x points on all transactions', 'Priority support', 'Free statement downloads'] },
    { name: 'Gold', minPoints: 5000, maxPoints: 14999, color: '#ffd700', icon: 'emoji_events', multiplier: 2, perks: ['2x points on all transactions', 'No transfer fees', 'Exclusive deals', 'Priority support'] },
    { name: 'Platinum', minPoints: 15000, maxPoints: 49999, color: '#b0c4de', icon: 'diamond', multiplier: 3, perks: ['3x points', 'Personal banking advisor', 'Airport lounge access', 'Premium insurance'] },
    { name: 'Diamond', minPoints: 50000, maxPoints: Infinity, color: '#00bcd4', icon: 'auto_awesome', multiplier: 5, perks: ['5x points', 'All Platinum perks', 'Exclusive concierge', 'Unlimited cashback'] },
  ];

  private summarySubject = new BehaviorSubject<RewardSummary>(this.getDefaultSummary());
  summary$ = this.summarySubject.asObservable();

  constructor(
    private accountService: AccountService,
    private transactionService: TransactionService
  ) {
    this.loadFromStorage();
  }

  private getDefaultSummary(): RewardSummary {
    return {
      totalPoints: 0, availablePoints: 0, redeemedPoints: 0,
      tier: this.tiers[0], lifetimeEarned: 0, thisMonthEarned: 0,
      streak: 0, history: []
    };
  }

  private loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      data.tier = this.getTierForPoints(data.totalPoints);
      this.summarySubject.next(data);
    }
  }

  private saveToStorage(summary: RewardSummary) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(summary));
    }
  }

  getTierForPoints(points: number): RewardTier {
    return this.tiers.slice().reverse().find(t => points >= t.minPoints) || this.tiers[0];
  }

  getAllTiers(): RewardTier[] { return this.tiers; }

  getSummary(): Observable<RewardSummary> {
    return of(this.summarySubject.value);
  }

  /** Real-time polling - recalculates rewards from transactions */
  getSummaryRealTime(): Observable<RewardSummary> {
    return interval(10000).pipe(
      startWith(0),
      switchMap(() => this.recalculateRewards())
    );
  }

  recalculateRewards(): Observable<RewardSummary> {
    return this.accountService.getAccounts().pipe(
      switchMap(accounts => {
        if (!accounts.length) return of(this.summarySubject.value);
        const active = accounts.find(a => a.status === 'ACTIVE') || accounts[0];
        return this.transactionService.getTransactions(active.id).pipe(
          map(txs => {
            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const summary = { ...this.summarySubject.value };

            // Calculate points: 1 point per Rs.100 spent (debit transactions)
            let totalPointsFromTx = 0;
            let monthPoints = 0;
            const history: RewardTransaction[] = [];

            txs.forEach((tx: any) => {
              const pts = Math.floor(tx.amount / 100);
              if (pts <= 0) return;

              const isDebit = tx.type === 'DEBIT' || tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER_OUT';
              const isCredit = tx.type === 'CREDIT' || tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN';

              const earned = isDebit ? pts : (isCredit ? Math.floor(pts * 0.5) : 0);
              if (earned <= 0) return;

              totalPointsFromTx += earned;
              if (new Date(tx.createdAt) >= monthStart) monthPoints += earned;

              history.push({
                id: 'rw_' + tx.id,
                description: tx.description || tx.type,
                amount: tx.amount,
                pointsEarned: earned,
                type: 'EARNED',
                category: tx.type,
                timestamp: tx.createdAt
              });
            });

            // Apply tier multiplier
            const tier = this.getTierForPoints(totalPointsFromTx + summary.redeemedPoints);
            const totalWithMultiplier = Math.floor(totalPointsFromTx * tier.multiplier);

            summary.totalPoints = totalWithMultiplier;
            summary.availablePoints = totalWithMultiplier - summary.redeemedPoints;
            summary.lifetimeEarned = totalWithMultiplier + summary.redeemedPoints;
            summary.thisMonthEarned = Math.floor(monthPoints * tier.multiplier);
            summary.tier = tier;
            summary.history = history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);

            // Streak: consecutive days with transactions
            const txDates = new Set(txs.map((t: any) => new Date(t.createdAt).toDateString()));
            let streak = 0;
            const d = new Date();
            while (txDates.has(d.toDateString())) { streak++; d.setDate(d.getDate() - 1); }
            summary.streak = streak;

            this.summarySubject.next(summary);
            this.saveToStorage(summary);
            return summary;
          })
        );
      })
    );
  }

  redeemPoints(points: number, description: string): boolean {
    const summary = { ...this.summarySubject.value };
    if (points > summary.availablePoints) return false;

    summary.redeemedPoints += points;
    summary.availablePoints -= points;
    summary.history.unshift({
      id: 'rd_' + Date.now(),
      description,
      amount: points,
      pointsEarned: -points,
      type: 'REDEEMED',
      category: 'REDEMPTION',
      timestamp: new Date().toISOString()
    });

    summary.tier = this.getTierForPoints(summary.totalPoints);
    this.summarySubject.next(summary);
    this.saveToStorage(summary);
    return true;
  }

  getNextTier(): RewardTier | null {
    const current = this.summarySubject.value.tier;
    const idx = this.tiers.findIndex(t => t.name === current.name);
    return idx < this.tiers.length - 1 ? this.tiers[idx + 1] : null;
  }

  getProgressToNextTier(): number {
    const summary = this.summarySubject.value;
    const next = this.getNextTier();
    if (!next) return 100;
    const range = next.minPoints - summary.tier.minPoints;
    const progress = summary.totalPoints - summary.tier.minPoints;
    return Math.min(100, Math.round((progress / range) * 100));
  }
}
