import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable surface card with optional header (icon + title + subtitle + actions slot).
 *
 * <app-ui-card icon="account_balance" title="Accounts" subtitle="3 active">
 *   ... body ...
 *   <ng-container actions><button class="btn btn-ghost">More</button></ng-container>
 * </app-ui-card>
 */
@Component({
  selector: 'app-ui-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="uic" [class.uic-hover]="hover" [class.uic-feature]="feature" [attr.aria-labelledby]="title ? titleId : null">
      <header class="uic-head" *ngIf="title || icon">
        <div class="uic-head-left">
          <span *ngIf="icon" class="uic-icon material-icons-outlined" aria-hidden="true">{{ icon }}</span>
          <div>
            <h3 [id]="titleId" class="uic-title">{{ title }}</h3>
            <span class="uic-sub" *ngIf="subtitle">{{ subtitle }}</span>
          </div>
        </div>
        <div class="uic-actions">
          <ng-content select="[actions]"></ng-content>
        </div>
      </header>
      <div class="uic-body" [class.uic-body--padless]="padless">
        <ng-content></ng-content>
      </div>
    </article>
  `,
  styleUrl: './ui-card.component.scss'
})
export class UiCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() hover = false;
  @Input() feature = false;
  @Input() padless = false;

  protected titleId = 'uic-' + Math.random().toString(36).slice(2, 9);
}
