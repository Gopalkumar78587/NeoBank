import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Page header — title, subtitle, leading icon, and optional projected actions.
 *
 * Usage:
 * <app-page-header icon="analytics" title="Dashboard" subtitle="Welcome back, Alex">
 *   <button class="btn btn-primary">New</button>
 * </app-page-header>
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="ph" [class.ph-hero]="variant === 'hero'">
      <div class="ph-bg" *ngIf="variant === 'hero'" aria-hidden="true">
        <span class="ph-blob ph-blob-a"></span>
        <span class="ph-blob ph-blob-b"></span>
      </div>

      <div class="ph-inner">
        <div class="ph-left">
          <span class="ph-eyebrow" *ngIf="eyebrow">{{ eyebrow }}</span>
          <h1 class="ph-title">
            <span *ngIf="icon" class="ph-icon material-icons-outlined" aria-hidden="true">{{ icon }}</span>
            <span>{{ title }}</span>
          </h1>
          <p class="ph-sub" *ngIf="subtitle">{{ subtitle }}</p>
        </div>
        <div class="ph-actions">
          <ng-content></ng-content>
        </div>
      </div>
    </header>
  `,
  styleUrl: './page-header.component.scss'
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() eyebrow?: string;
  /** 'flat' = subtle card on light bg, 'hero' = gradient banner */
  @Input() variant: 'flat' | 'hero' = 'flat';
}
