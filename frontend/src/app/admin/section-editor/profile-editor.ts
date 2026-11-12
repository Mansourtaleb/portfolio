import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, HostListener, inject, signal, viewChild } from '@angular/core';

import { AdminApiService } from '../../core/admin-api.service';
import { ApiProblem, CvInfo, Profile } from '../../core/models';
import { Avatar } from '../../shared/avatar';
import { Icon } from '../../shared/icon';
import { ToastService } from '../../shared/toast';
import { HasUnsavedChanges } from '../../shared/unsaved-changes';
import { AvatarCropper } from './avatar-cropper';
import { DynamicForm } from './dynamic-form';
import { PROFILE_FIELDS } from './sections';
import { TranslationPanel } from './translation-panel';
import { PublicationState } from '../publication.service';
import { UNSAVED_MESSAGE } from '../../shared/unsaved-changes';

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

/** Profil / hero (ligne unique), photo de profil et CV PDF. */
@Component({
  selector: 'app-profile-editor',
  imports: [DynamicForm, Icon, Avatar, AvatarCropper, TranslationPanel],
  styles: `
    .lang-tabs { display: inline-flex; padding: 3px; gap: 2px; margin-bottom: 16px; border-radius: 10px; background: var(--bg-soft); border: 1px solid var(--border); }
    .lang-tabs button { border: 0; background: transparent; color: var(--text-muted); font: 500 13px var(--font); padding: 6px 14px; border-radius: 8px; cursor: pointer; }
    .lang-tabs button.active { background: var(--accent-strong); color: #fff; }
  `,
  template: `
    <h1 class="text-2xl font-bold flex items-center gap-2 mb-1"><app-icon name="user" [size]="22" /> Profil, hero &amp; CV</h1>
    <p class="text-muted text-sm mb-6">Identité, photo, accroche du hero, coordonnées et CV téléchargeable.</p>

    <div class="grid gap-6 lg:grid-cols-2 mb-6">
      <section class="card">
        <h2 class="font-semibold mb-1 flex items-center gap-2"><app-icon name="camera" [size]="18" /> Photo de profil</h2>
        <p class="text-sm text-muted mb-5">Affichée dans le hero, l'en-tête et la bulle de l'assistant. Sans photo : initiales.</p>
        @if (cropFile(); as file) {
          <app-avatar-cropper [file]="file" [busy]="uploadingAvatar()" (cropped)="uploadAvatar($event)" (cancel)="cropFile.set(null)" />
        } @else {
          <div class="flex items-center gap-5">
            <app-avatar [src]="avatarUrl()" [name]="profile()?.fullName ?? ''" [size]="96" [halo]="true" [available]="true" />
            <div class="flex flex-col gap-2">
              <label class="btn btn-sm cursor-pointer">
                <app-icon name="camera" [size]="15" /> {{ avatarUrl() ? 'Changer la photo' : 'Ajouter une photo' }}
                <input type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" (change)="pickAvatar($event)" />
              </label>
              @if (avatarUrl()) {
                <button class="btn btn-sm btn-danger" type="button" (click)="deleteAvatar()"><app-icon name="trash" [size]="14" /> Retirer</button>
              }
              <span class="text-xs text-faint">JPG, PNG ou WebP · recadrée en 512×512</span>
            </div>
          </div>
        }
      </section>

      <section class="card">
        <h2 class="font-semibold mb-1 flex items-center gap-2"><app-icon name="download" [size]="18" /> CV téléchargeable (PDF)</h2>
        <p class="text-sm text-muted mb-5">Alimente le bouton « Télécharger le CV » de la vitrine (5 Mo max).</p>
        @if (cv(); as c) {
          <div class="flex flex-wrap items-center gap-3 mb-4 text-sm">
            <span class="chip chip-success">En ligne</span>
            <a [href]="c.url" target="_blank" rel="noopener" class="mono">{{ c.fileName }}</a>
            <span class="text-faint mono">{{ (c.sizeBytes / 1024).toFixed(0) }} Ko</span>
          </div>
        } @else {
          <p class="text-sm text-warn mb-4">Aucun CV : le bouton est masqué sur la vitrine.</p>
        }
        <div class="flex gap-2">
          <label class="btn btn-sm cursor-pointer">
            <app-icon name="plus" [size]="15" /> {{ cv() ? 'Remplacer le PDF' : 'Téléverser un PDF' }}
            <input type="file" accept="application/pdf" class="sr-only" (change)="uploadCv($event)" />
          </label>
          @if (cv()) {
            <button class="btn btn-sm btn-danger" type="button" (click)="deleteCv()">Retirer</button>
          }
        </div>
      </section>
    </div>

    <section class="card">
      <h2 class="font-semibold mb-4">Informations</h2>
        @if (profile()) {
          <div class="lang-tabs" role="tablist" aria-label="Langue du contenu">
            <button type="button" role="tab" [class.active]="tab() === 'fr'" [attr.aria-selected]="tab() === 'fr'" (click)="switchTab('fr')">Français</button>
            <button type="button" role="tab" [class.active]="tab() === 'en'" [attr.aria-selected]="tab() === 'en'" (click)="switchTab('en')">English</button>
          </div>
        }
      @if (profile(); as p) {
        @if (tab() === 'en') {
          <app-translation-panel entity="profile" [entityId]="1" [fields]="fields" [french]="$any(p)" (dirtyChange)="dirty.set($event)" />
        } @else {
          <app-dynamic-form #form [fields]="fields" [value]="p" [saving]="saving()" [errors]="errors()"
            (save)="save($event)" (dirtyChange)="dirty.set($event)" />
        }
      } @else {
        <div class="space-y-3"><div class="skeleton h-10"></div><div class="skeleton h-10"></div><div class="skeleton h-24"></div></div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEditor implements HasUnsavedChanges {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  private readonly form = viewChild<DynamicForm>('form');
  protected readonly fields = PROFILE_FIELDS;
  protected readonly profile = signal<Profile | null>(null);
  protected readonly cv = signal<CvInfo | null>(null);
  protected readonly avatarUrl = signal<string | null>(null);
  protected readonly cropFile = signal<File | null>(null);
  protected readonly uploadingAvatar = signal(false);
  protected readonly saving = signal(false);
  protected readonly dirty = signal(false);
  protected readonly errors = signal<Record<string, string>>({});
  private readonly publication = inject(PublicationState);

  /** Onglet de langue du formulaire (le français est la langue de référence). */
  protected readonly tab = signal<'fr' | 'en'>('fr');

  protected switchTab(tab: 'fr' | 'en'): void {
    if (tab !== this.tab() && this.dirty() && !confirm(UNSAVED_MESSAGE)) {
      return;
    }
    this.dirty.set(false);
    this.tab.set(tab);
  }

  constructor() {
    this.api.profile().subscribe((p) => this.profile.set(p));
    this.api.cvInfo().subscribe((c) => this.cv.set(c));
    this.api.avatar().subscribe((a) => this.avatarUrl.set(a?.url ?? null));
  }

  hasUnsavedChanges(): boolean {
    return this.dirty() || !!this.cropFile();
  }

  @HostListener('window:beforeunload', ['$event'])
  protected beforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }

  protected save(value: Record<string, unknown>): void {
    this.saving.set(true);
    this.errors.set({});
    this.api.saveProfile(value as Partial<Profile>).subscribe({
      next: () => {
        this.saving.set(false);
        this.form()?.markSaved();
        this.toast.success('Profil enregistré (à publier).');
        this.publication.refresh();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        const problem = e.error as ApiProblem | null;
        this.errors.set(problem?.errors ?? {});
        this.toast.error(problem?.detail ?? "L'enregistrement a échoué.");
      },
    });
  }

  protected pickAvatar(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) {
      return;
    }
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      this.toast.error('Choisissez une image JPG, PNG ou WebP.');
    } else if (file.size > MAX_SOURCE_BYTES) {
      this.toast.error('Image trop lourde (15 Mo maximum avant recadrage).');
    } else {
      this.cropFile.set(file);
    }
  }

  protected uploadAvatar(image: Blob): void {
    this.uploadingAvatar.set(true);
    this.api.uploadAvatar(image).subscribe({
      next: (a) => {
        this.uploadingAvatar.set(false);
        this.cropFile.set(null);
        this.avatarUrl.set(a.url);
        this.toast.success('Photo de profil mise à jour.');
      },
      error: (e: HttpErrorResponse) => {
        this.uploadingAvatar.set(false);
        this.toast.error((e.error as ApiProblem | null)?.detail ?? "La photo n'a pas pu être envoyée.");
      },
    });
  }

  protected deleteAvatar(): void {
    if (confirm('Retirer la photo de profil ? Les initiales seront affichées à la place.')) {
      this.api.deleteAvatar().subscribe(() => {
        this.avatarUrl.set(null);
        this.toast.success('Photo retirée.');
      });
    }
  }

  protected uploadCv(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) {
      return;
    }
    this.api.uploadCv(file).subscribe({
      next: (c) => {
        this.cv.set(c);
        this.toast.success('CV publié.');
      },
      error: (e: HttpErrorResponse) =>
        this.toast.error((e.error as ApiProblem | null)?.detail ?? "Le fichier n'a pas pu être envoyé."),
    });
  }

  protected deleteCv(): void {
    if (confirm('Retirer le CV du site ?')) {
      this.api.deleteCv().subscribe(() => {
        this.cv.set(null);
        this.toast.success('CV retiré.');
      });
    }
  }
}
