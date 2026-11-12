import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { Icon } from '../../shared/icon';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, Icon],
  template: `
    <main class="min-h-screen grid place-items-center px-4 bg-bg">
      <form class="card w-full max-w-sm" (ngSubmit)="submit()" #f="ngForm">
        <div class="flex items-center gap-3 mb-6">
          <span class="grid place-items-center w-10 h-10 rounded-xl bg-accent-soft text-accent"><app-icon name="lock" /></span>
          <div>
            <h1 class="text-lg font-bold">Espace admin</h1>
            <p class="text-sm text-muted">Gestion de la vitrine</p>
          </div>
        </div>
        <div class="field">
          <label for="u">Identifiant</label>
          <input id="u" class="input" name="username" [(ngModel)]="username" required autocomplete="username" />
        </div>
        <div class="field">
          <label for="p">Mot de passe</label>
          <input id="p" class="input" type="password" name="password" [(ngModel)]="password" required autocomplete="current-password" />
        </div>
        @if (error()) { <p class="alert alert-error mb-4">{{ error() }}</p> }
        <button class="btn btn-primary w-full" type="submit" [disabled]="loading() || f.invalid">
          {{ loading() ? 'Connexion…' : 'Se connecter' }}
        </button>
        <a routerLink="/" class="block text-center text-sm text-muted mt-4">← Retour au site</a>
      </form>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected username = '';
  protected password = '';
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: (e: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(e.status === 429 ? e.error?.detail ?? 'Trop de tentatives.' : 'Identifiants incorrects.');
      },
    });
  }
}
