import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../core/auth.service';
import { ApiProblem } from '../../core/models';
import { Icon } from '../../shared/icon';
import { BackupCard } from './backup-card';

@Component({
  selector: 'app-account',
  imports: [FormsModule, Icon, BackupCard],
  template: `
    <h1 class="text-2xl font-bold flex items-center gap-2 mb-6"><app-icon name="lock" [size]="22" /> Mon compte</h1>
    <form class="card max-w-md" (ngSubmit)="save()" #f="ngForm">
      <h2 class="font-semibold mb-4">Changer le mot de passe</h2>
      <div class="field">
        <label for="cur">Mot de passe actuel</label>
        <input id="cur" class="input" type="password" name="current" [(ngModel)]="current" required autocomplete="current-password" />
      </div>
      <div class="field">
        <label for="new">Nouveau mot de passe</label>
        <input id="new" class="input" type="password" name="next" [(ngModel)]="next" required minlength="10" autocomplete="new-password" />
        <span class="hint">10 caractères minimum</span>
      </div>
      @if (notice(); as n) { <p class="alert mb-4" [class.alert-success]="n.ok" [class.alert-error]="!n.ok">{{ n.text }}</p> }
      <button class="btn btn-primary" type="submit" [disabled]="f.invalid || saving()">Enregistrer</button>
    </form>
    <app-backup-card />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Account {
  private readonly auth = inject(AuthService);
  protected current = '';
  protected next = '';
  protected readonly saving = signal(false);
  protected readonly notice = signal<{ ok: boolean; text: string } | null>(null);

  protected save(): void {
    this.saving.set(true);
    this.auth.changePassword(this.current, this.next).subscribe({
      next: () => {
        this.saving.set(false);
        this.current = '';
        this.next = '';
        this.notice.set({ ok: true, text: 'Mot de passe modifié.' });
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        const p = e.error as ApiProblem | null;
        this.notice.set({ ok: false, text: p?.errors?.['newPassword'] ?? p?.detail ?? 'Échec de la modification.' });
      },
    });
  }
}
