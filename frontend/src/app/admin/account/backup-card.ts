import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ApiProblem } from '../../core/models';
import { Icon } from '../../shared/icon';
import { ToastService } from '../../shared/toast';
import { PublicationState } from '../publication.service';

/** Sauvegarde du contenu en fichier JSON et restauration (le résultat reste en brouillon). */
@Component({
  selector: 'app-backup-card',
  imports: [Icon],
  template: `
    <section class="card max-w-xl mt-6">
      <h2 class="font-semibold mb-1 flex items-center gap-2"><app-icon name="download" [size]="18" /> Sauvegarde du contenu</h2>
      <p class="text-sm text-muted mb-4">
        Un fichier JSON avec le profil, les réglages, toutes les sections et les traductions.
        Les fichiers (photo, CV, captures), les messages et les statistiques ne sont pas inclus.
      </p>
      <div class="flex flex-wrap gap-2">
        <button class="btn btn-primary btn-sm" type="button" [disabled]="busy()" (click)="download()">
          <app-icon name="download" [size]="15" /> Télécharger une sauvegarde
        </button>
        <label class="btn btn-sm cursor-pointer" [class.opacity-50]="busy()">
          <app-icon name="refresh" [size]="15" /> Restaurer un fichier…
          <input type="file" accept="application/json,.json" class="sr-only" [disabled]="busy()" (change)="restore($event)" />
        </label>
      </div>
      <p class="text-xs text-faint mt-3">La restauration remplace le contenu actuel. Elle reste en brouillon : vérifiez avec « Aperçu », puis « Publier ».</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupCard {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly publication = inject(PublicationState);
  protected readonly busy = signal(false);

  protected download(): void {
    this.busy.set(true);
    this.http.get('/api/admin/backup', { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.busy.set(false);
        this.toast.success('Sauvegarde téléchargée.');
      },
      error: () => {
        this.busy.set(false);
        this.toast.error('La sauvegarde a échoué.');
      },
    });
  }

  protected async restore(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    let backup: unknown;
    try {
      backup = JSON.parse(await file.text());
    } catch {
      this.toast.error("Ce fichier n'est pas un JSON valide.");
      return;
    }
    if (!confirm('Remplacer tout le contenu actuel par cette sauvegarde ? (les fichiers ne sont pas touchés)')) {
      return;
    }
    this.busy.set(true);
    this.http.post<Record<string, number>>('/api/admin/backup/restore', backup).subscribe({
      next: (counts) => {
        this.busy.set(false);
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        this.toast.success(`Sauvegarde restaurée (${total} éléments) : vérifiez puis publiez.`);
        this.publication.refresh();
      },
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.toast.error((e.error as ApiProblem | null)?.detail ?? 'La restauration a échoué.');
      },
    });
  }
}
