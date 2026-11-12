import { Injectable, inject, signal } from '@angular/core';

import { AdminApiService } from '../core/admin-api.service';
import { PublicationStatus } from '../core/models';
import { ToastService } from '../shared/toast';

/** État « brouillon / publié » partagé dans l'admin (barre du haut, tableau de bord, éditeurs). */
@Injectable({ providedIn: 'root' })
export class PublicationState {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  readonly status = signal<PublicationStatus | null>(null);
  readonly publishing = signal(false);

  refresh(): void {
    this.api.publicationStatus().subscribe({ next: (s) => this.status.set(s), error: () => undefined });
  }

  publish(): void {
    this.publishing.set(true);
    this.api.publish().subscribe({
      next: (s) => {
        this.status.set(s);
        this.publishing.set(false);
        this.toast.success('Vitrine publiée : les visiteurs voient la nouvelle version (FR + EN).');
      },
      error: () => {
        this.publishing.set(false);
        this.toast.error('La publication a échoué.');
      },
    });
  }
}
