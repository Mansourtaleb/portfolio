import { ChangeDetectionStrategy, Component, Injectable, inject, signal } from '@angular/core';

import { Icon } from './icon';

export type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

/** Notifications courtes en bas à droite (succès, erreur, info), fermées automatiquement. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  success(text: string): void {
    this.show('success', text);
  }

  error(text: string): void {
    this.show('error', text, 6000);
  }

  info(text: string): void {
    this.show('info', text);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(kind: ToastKind, text: string, duration = 3500): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list.slice(-3), { id, kind, text }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}

@Component({
  selector: 'app-toasts',
  imports: [Icon],
  template: `
    <div class="stack" aria-live="polite" aria-atomic="false">
      @for (t of service.toasts(); track t.id) {
        <div class="toast" [class]="'toast ' + t.kind" role="status">
          <app-icon [name]="t.kind === 'error' ? 'x' : t.kind === 'success' ? 'check' : 'sparkles'" [size]="16" />
          <span>{{ t.text }}</span>
          <button type="button" (click)="service.dismiss(t.id)" aria-label="Fermer"><app-icon name="x" [size]="14" /></button>
        </div>
      }
    </div>
  `,
  styles: `
    .stack { position: fixed; right: 20px; bottom: 20px; z-index: 100; display: flex; flex-direction: column; gap: 8px;
      width: min(360px, calc(100vw - 40px)); }
    .toast { display: flex; align-items: center; gap: 10px; padding: 12px 12px 12px 14px; border-radius: 12px;
      background: var(--bg-solid); border: 1px solid var(--border-strong); box-shadow: var(--shadow-hover);
      font-size: 14px; color: var(--text); animation: slide-in 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }
    .toast span { flex: 1; }
    .success app-icon { color: var(--success); }
    .error { border-color: var(--danger); }
    .error app-icon { color: var(--danger); }
    .info app-icon { color: var(--cyan); }
    button { all: unset; cursor: pointer; color: var(--text-faint); display: inline-flex; }
    button:hover { color: var(--text); }
    @keyframes slide-in { from { opacity: 0; transform: translateY(10px) scale(0.98); } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toasts {
  protected readonly service = inject(ToastService);
}
