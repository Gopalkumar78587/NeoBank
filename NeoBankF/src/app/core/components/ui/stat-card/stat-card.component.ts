import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

type StatTone = 'indigo' | 'green' | 'red' | 'orange' | 'teal' | 'purple';

/**
 * KPI / metric card with icon, value, label, and optional delta trend.
 *
 * <app-stat-card icon="payments" tone="green"
 *   label="Total Balance" [value]="125000" prefix="₹"
 *   [delta]="3.4" deltaLabel="vs last month"></app-stat-card>
 */
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="sc" [attr.data-tone]="tone">
      <div class="sc-icon">
        <span class="material-icons-outlined" aria-hidden="true">{{ icon }}</span>
      </div>
      <div class="sc-body">
        <span class="sc-label">{{ label }}</span>
        <strong class="sc-value">
          <span *ngIf="prefix">{{ prefix }}</span>
          <ng-container *ngIf="isNumber; else rawValue">{{ value | number:digits }}</ng-container>
          <ng-template #rawValue>{{ value }}</ng-template>
          <span class="sc-suffix" *ngIf="suffix">{{ suffix }}</span>
        </strong>
        <span class="sc-delta" *ngIf="delta !== undefined && delta !== null"
              [class.up]="delta >= 0" [class.down]="delta < 0">
          <span class="material-icons-outlined" aria-hidden="true">
            {{ delta >= 0 ? 'trending_up' : 'trending_down' }}
          </span>
          {{ delta >= 0 ? '+' : '' }}{{ delta | number:'1.0-1' }}%
          <small *ngIf="deltaLabel">{{ deltaLabel }}</small>
        </span>
      </div>
    </article>
  `,
  styleUrl: './stat-card.component.scss'
})
export class StatCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input() icon = 'bar_chart';
  @Input() tone: StatTone = 'indigo';
  @Input() prefix?: string;
  @Input() suffix?: string;
  @Input() digits = '1.0-0';
  @Input() delta?: number | null;
  @Input() deltaLabel?: string;

  get isNumber(): boolean { return typeof this.value === 'number'; }
}
