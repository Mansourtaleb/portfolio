import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { AdminApiService } from '../../core/admin-api.service';
import { ContactMessage } from '../../core/models';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-messages',
  imports: [DatePipe, Icon],
  template: `
    <h1 class="text-2xl font-bold flex items-center gap-2 mb-1"><app-icon name="mail" [size]="22" /> Messages</h1>
    <p class="text-muted text-sm mb-6">Messages reçus via le formulaire de contact de la vitrine.</p>
    <div class="space-y-3">
      @for (m of messages(); track m.id) {
        <article class="card" [style.border-color]="m.readAt ? null : 'var(--accent-strong)'">
          <div class="flex flex-wrap items-start gap-3">
            <div class="min-w-0 flex-1">
              <p class="font-semibold">
                @if (!m.readAt) { <span class="inline-block w-2 h-2 rounded-full bg-cyan mr-1 align-middle"></span> }
                {{ m.subject || '(sans objet)' }}
              </p>
              <p class="text-sm text-muted">{{ m.name }} · <a [href]="'mailto:' + m.email">{{ m.email }}</a></p>
            </div>
            <span class="text-xs text-faint mono">{{ m.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
          </div>
          <p class="mt-3 text-sm whitespace-pre-line">{{ m.message }}</p>
          <div class="flex gap-2 mt-4">
            <a class="btn btn-sm" [href]="'mailto:' + m.email + '?subject=' + encode('Re: ' + (m.subject || 'votre message'))"><app-icon name="send" [size]="14" /> Répondre</a>
            <button class="btn btn-sm btn-ghost" type="button" (click)="toggleRead(m)">{{ m.readAt ? 'Marquer non lu' : 'Marquer lu' }}</button>
            <button class="btn btn-sm btn-danger ml-auto" type="button" (click)="remove(m)"><app-icon name="trash" [size]="14" /> Supprimer</button>
          </div>
        </article>
      } @empty {
        <p class="card text-muted text-sm">Aucun message pour l'instant.</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Messages {
  private readonly api = inject(AdminApiService);
  protected readonly messages = signal<ContactMessage[]>([]);

  constructor() {
    this.load();
  }

  protected encode(value: string): string {
    return encodeURIComponent(value);
  }

  protected toggleRead(m: ContactMessage): void {
    this.api.markRead(m.id, !m.readAt).subscribe(() => this.load());
  }

  protected remove(m: ContactMessage): void {
    if (confirm(`Supprimer définitivement le message de ${m.name} ?`)) {
      this.api.deleteMessage(m.id).subscribe(() => this.load());
    }
  }

  private load(): void {
    this.api.messages().subscribe((list) => this.messages.set(list));
  }
}
