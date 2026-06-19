import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="toast-stack" role="status" aria-live="polite">
    <div
      *ngFor="let t of toast.toasts()"
      class="toast"
      [class.success]="t.type === 'success'"
      [class.error]="t.type === 'error'"
      [class.info]="t.type === 'info'"
      [class.warning]="t.type === 'warning'">
      <span class="toast-icon material-icons-outlined">{{ iconFor(t.type) }}</span>
      <div class="toast-body">
        <div class="toast-title">{{ t.title }}</div>
        <div class="toast-msg" *ngIf="t.message">{{ t.message }}</div>
      </div>
      <button class="toast-close" (click)="toast.dismiss(t.id)" aria-label="Close">
        <span class="material-icons-outlined">close</span>
      </button>
    </div>
  </div>
  `,
  styles: [`
    .toast-stack{position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;max-width:380px;pointer-events:none}
    .toast{pointer-events:auto;display:flex;align-items:flex-start;gap:12px;background:#fff;border-radius:10px;padding:14px 14px 14px 16px;box-shadow:0 8px 24px rgba(15,23,42,.18),0 2px 4px rgba(15,23,42,.06);border-left:4px solid #94a3b8;min-width:300px;animation:slideIn .25s ease-out}
    @keyframes slideIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
    .toast.success{border-left-color:#16a34a}
    .toast.success .toast-icon{color:#16a34a}
    .toast.error{border-left-color:#dc2626}
    .toast.error .toast-icon{color:#dc2626}
    .toast.warning{border-left-color:#f59e0b}
    .toast.warning .toast-icon{color:#f59e0b}
    .toast.info{border-left-color:#2563eb}
    .toast.info .toast-icon{color:#2563eb}
    .toast-icon{font-size:24px;line-height:1;flex-shrink:0;margin-top:2px}
    .toast-body{flex:1;min-width:0}
    .toast-title{font-weight:600;color:#0f172a;font-size:14px;line-height:1.3}
    .toast-msg{margin-top:4px;color:#475569;font-size:13px;line-height:1.45;word-wrap:break-word}
    .toast-close{background:transparent;border:0;color:#94a3b8;cursor:pointer;padding:2px;display:flex;align-items:center;justify-content:center;border-radius:4px;flex-shrink:0}
    .toast-close:hover{background:#f1f5f9;color:#475569}
    .toast-close .material-icons-outlined{font-size:18px}
  `]
})
export class ToastComponent {
  toast = inject(ToastService);

  iconFor(type: string): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }
}
