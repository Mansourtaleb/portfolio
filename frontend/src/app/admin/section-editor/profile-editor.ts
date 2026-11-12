import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { AdminApiService } from '../../core/admin-api.service';
import { ApiProblem, CvInfo, Profile } from '../../core/models';
import { Icon } from '../../shared/icon';
import { DynamicForm } from './dynamic-form';
import { PROFILE_FIELDS } from './sections';

/** Profil / hero (ligne unique) + téléversement du CV PDF. */
@Component({
  selector: 'app-profile-editor',
  imports: [DynamicForm, Icon],
  template: `
    <h1 class="text-2xl font-bold flex items-center gap-2 mb-1"><app-icon name="user" [size]="22" /> Profil, hero &amp; CV</h1>
    <p class="text-muted text-sm mb-6">Identité, accroche du hero, coordonnées et CV téléchargeable.</p>

    <section class="card mb-6">
      <h2 class="font-semibold mb-1 flex items-center gap-2"><app-icon name="download" [size]="18" /> CV téléchargeable (PDF)</h2>
      <p class="text-sm text-muted mb-4">Le fichier téléversé alimente le bouton « Télécharger le CV » de la vitrine (5 Mo max).</p>
      @if (cv(); as c) {
        <div class="flex flex-wrap items-center gap-3 mb-3 text-sm">
          <span class="chip chip-success">En ligne</span>
          <a [href]="c.url" target="_blank" rel="noopener" class="mono">{{ c.fileName }}</a>
          <span class="text-faint mono">{{ (c.sizeBytes / 1024).toFixed(0) }} Ko</span>
          <button class="btn btn-sm btn-danger ml-auto" type="button" (click)="deleteCv()">Retirer</button>
        </div>
      } @else {
        <p class="text-sm text-warn mb-3">Aucun CV téléversé : le bouton n'apparaît que si un lien est saisi plus bas.</p>
      }
      <label class="btn btn-sm cursor-pointer">
        <app-icon name="plus" [size]="15" /> {{ cv() ? 'Remplacer le PDF' : 'Téléverser un PDF' }}
        <input type="file" accept="application/pdf" class="sr-only" (change)="uploadCv($event)" />
      </label>
      @if (cvMessage(); as m) { <p class="alert mt-3" [class.alert-success]="m.ok" [class.alert-error]="!m.ok">{{ m.text }}</p> }
    </section>

    <section class="card">
      @if (notice(); as n) { <p class="alert mb-4" [class.alert-success]="n.ok" [class.alert-error]="!n.ok">{{ n.text }}</p> }
      @if (profile(); as p) {
        <app-dynamic-form [fields]="fields" [value]="p" [saving]="saving()" [errors]="errors()" (save)="save($event)" />
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEditor {
  private readonly api = inject(AdminApiService);
  protected readonly fields = PROFILE_FIELDS;
  protected readonly profile = signal<Profile | null>(null);
  protected readonly cv = signal<CvInfo | null>(null);
  protected readonly saving = signal(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly notice = signal<{ ok: boolean; text: string } | null>(null);
  protected readonly cvMessage = signal<{ ok: boolean; text: string } | null>(null);

  constructor() {
    this.api.profile().subscribe((p) => this.profile.set(p));
    this.api.cvInfo().subscribe((c) => this.cv.set(c));
  }

  protected save(value: Record<string, unknown>): void {
    this.saving.set(true);
    this.errors.set({});
    this.api.saveProfile(value as Partial<Profile>).subscribe({
      next: (p) => {
        this.saving.set(false);
        this.profile.set(p);
        this.notice.set({ ok: true, text: 'Profil enregistré.' });
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        const problem = e.error as ApiProblem | null;
        this.errors.set(problem?.errors ?? {});
        this.notice.set({ ok: false, text: problem?.detail ?? "L'enregistrement a échoué." });
      },
    });
  }

  protected uploadCv(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) {
      return;
    }
    this.cvMessage.set({ ok: true, text: 'Envoi…' });
    this.api.uploadCv(file).subscribe({
      next: (c) => {
        this.cv.set(c);
        this.cvMessage.set({ ok: true, text: 'CV publié.' });
      },
      error: (e: HttpErrorResponse) =>
        this.cvMessage.set({ ok: false, text: (e.error as ApiProblem | null)?.detail ?? "Le fichier n'a pas pu être envoyé." }),
    });
  }

  protected deleteCv(): void {
    if (!confirm('Retirer le CV du site ?')) {
      return;
    }
    this.api.deleteCv().subscribe(() => {
      this.cv.set(null);
      this.cvMessage.set({ ok: true, text: 'CV retiré.' });
    });
  }
}
