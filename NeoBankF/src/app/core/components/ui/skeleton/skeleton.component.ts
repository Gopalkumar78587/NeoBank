import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

type Shape = 'line' | 'text' | 'avatar' | 'card' | 'block';

/**
 * Loading skeleton primitive — use to indicate content is loading.
 *
 * <app-skeleton shape="line" width="60%"></app-skeleton>
 * <app-skeleton shape="card" height="180px"></app-skeleton>
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="sk"
          [class.sk-line]="shape === 'line'"
          [class.sk-text]="shape === 'text'"
          [class.sk-avatar]="shape === 'avatar'"
          [class.sk-card]="shape === 'card'"
          [class.sk-block]="shape === 'block'"
          [style.width]="width"
          [style.height]="height"
          [attr.aria-label]="'Loading'"
          role="presentation">
    </span>
  `,
  styleUrl: './skeleton.component.scss'
})
export class SkeletonComponent {
  @Input() shape: Shape = 'line';
  @Input() width?: string;
  @Input() height?: string;
}
