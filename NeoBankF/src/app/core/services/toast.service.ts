import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  durationMs: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {

  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private nextId = 1;

  success(title: string, message?: string, durationMs = 3500) {
    this.push('success', title, message, durationMs);
  }

  error(title: string, message?: string, durationMs = 5000) {
    this.push('error', title, message, durationMs);
  }

  info(title: string, message?: string, durationMs = 3500) {
    this.push('info', title, message, durationMs);
  }

  warning(title: string, message?: string, durationMs = 4000) {
    this.push('warning', title, message, durationMs);
  }

  /** Convenience: parse HttpErrorResponse into a friendly reason. */
  fromHttpError(err: any, fallback = 'Something went wrong'): string {
    if (!err) return fallback;
    const body = err.error;
    if (typeof body === 'string' && body.trim()) return body;
    if (body?.message) return body.message;
    if (body?.error) return body.error;
    if (err.message) return err.message;
    return fallback;
  }

  dismiss(id: number) {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private push(type: ToastType, title: string, message: string | undefined, durationMs: number) {
    const id = this.nextId++;
    const toast: Toast = { id, type, title, message, durationMs };
    this._toasts.update(list => [...list, toast]);
    if (durationMs > 0 && typeof window !== 'undefined') {
      window.setTimeout(() => this.dismiss(id), durationMs);
    }
  }
}
