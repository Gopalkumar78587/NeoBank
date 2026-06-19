import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Empty state with icon, title, hint, and optional CTA slot.
 *
 * <app-empty-state icon="inbox" title="No transactions yet" hint="Money you send and receive will show up here">
 *   <button class="btn btn-primary">Send Money</button>
 * </app-empty-state>
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="es" [class.es-compact]="compact" role="status">
      <span class="es-icon material-icons-outlined" aria-hidden="true">{{ icon }}</span>
      <h4 class="es-title">{{ title }}</h4>
      <p class="es-hint" *ngIf="hint">{{ hint }}</p>
      <div class="es-cta"><ng-content></ng-content></div>
    </div>
  `,
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  @Input({ required: true }) title!: string;
  @Input() hint?: string;
  @Input() icon = 'inbox';
  @Input() compact = false;
}
