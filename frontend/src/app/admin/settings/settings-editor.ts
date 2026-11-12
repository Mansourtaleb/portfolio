import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminApiService } from '../../core/admin-api.service';
import { ApiProblem, SectionKey, SiteSettings } from '../../core/models';
import { SECTION_LABELS } from '../../public/home/home';
import { Icon } from '../../shared/icon';
import { ToastService } from '../../shared/toast';
import { HasUnsavedChanges } from '../../shared/unsaved-changes';
import { TagInput } from '../section-editor/tag-input';

const SECTION_HINTS: Record<SectionKey, string> = {
  about: 'Présentation, localisation, langues, qualités',
  skills: 'Bento des compétences + chiffres clés',
  experience: 'Frise chronologique',
  projects: 'Cartes projets + filtre par techno',
  education: 'Diplômes, certifications, langues',
  contact: 'Coordonnées + formulaire',
};

/** Ordre et visibilité des sections, thème par défaut, SEO, assistant et formulaire de contact. */
@Component({
  selector: 'app-settings-editor',
  imports: [FormsModule, Icon, CdkDropList, CdkDrag, CdkDragHandle, TagInput],
  template: `
    <h1 class="text-2xl font-bold flex items-center gap-2 mb-1"><app-icon name="settings" [size]="22" /> Sections &amp; réglages</h1>
    <p class="text-muted text-sm mb-6">Organisation de la page d'accueil et options globales du site.</p>

    @if (s(); as st) {
      <form (ngSubmit)="save()" (input)="touch()" (change)="touch()" class="grid gap-6 lg:grid-cols-2">
        <section class="card">
          <h2 class="font-semibold mb-1">Ordre des sections</h2>
          <p class="text-sm text-muted mb-4">Glissez pour réordonner, décochez pour masquer une section.</p>
          <ul class="space-y-2" cdkDropList (cdkDropListDropped)="drop($event)">
            @for (key of st.sectionOrder; track key; let i = $index) {
              <li class="section-row" [class.off]="isHidden(key)" cdkDrag cdkDragLockAxis="y">
                <span class="handle" cdkDragHandle><app-icon name="grip" [size]="17" /></span>
                <span class="mono text-xs text-faint w-5">{{ i + 1 }}</span>
                <span class="flex-1 min-w-0">
                  <span class="block font-medium">{{ labels[key] }}</span>
                  <span class="block text-xs text-faint truncate">{{ hints[key] }}</span>
                </span>
                <label class="switch" [title]="isHidden(key) ? 'Afficher' : 'Masquer'">
                  <input type="checkbox" [checked]="!isHidden(key)" (change)="toggleHidden(key)" [attr.aria-label]="'Afficher ' + labels[key]" />
                  <span></span>
                </label>
              </li>
            }
          </ul>
        </section>

        <section class="card">
          <h2 class="font-semibold mb-4">Site</h2>
          <div class="field">
            <label for="t">Titre (onglet du navigateur)</label>
            <input id="t" class="input" name="siteTitle" [(ngModel)]="st.siteTitle" required maxlength="160" />
          </div>
          <div class="field">
            <label for="m">Description (SEO)</label>
            <textarea id="m" class="textarea" name="metaDescription" rows="2" maxlength="300" [(ngModel)]="st.metaDescription"></textarea>
            <span class="hint">{{ (st.metaDescription ?? '').length }}/300 · idéalement 120 à 160 caractères</span>
          </div>
          <div class="field">
            <label for="th">Thème par défaut</label>
            <select id="th" class="select" name="defaultTheme" [(ngModel)]="st.defaultTheme">
              <option value="dark">Sombre (Nuit tech)</option>
              <option value="light">Clair</option>
            </select>
          </div>
          <label class="checkbox"><input type="checkbox" name="contactFormEnabled" [(ngModel)]="st.contactFormEnabled" /> Formulaire de contact actif</label>
        </section>

        <section class="card lg:col-span-2">
          <h2 class="font-semibold mb-4">Assistant IA</h2>
          <label class="checkbox mb-4"><input type="checkbox" name="assistantEnabled" [(ngModel)]="st.assistantEnabled" /> Afficher la bulle de l'assistant</label>
          <div class="field">
            <label for="g">Message d'accueil</label>
            <textarea id="g" class="textarea" name="assistantGreeting" rows="2" maxlength="500" [(ngModel)]="st.assistantGreeting"></textarea>
          </div>
          <div class="field">
            <label for="sg">Questions suggérées</label>
            <app-tag-input inputId="sg" [value]="st.assistantSuggestions" (valueChange)="setSuggestions($event)"
              placeholder="Tapez une question puis Entrée" />
            <span class="hint">6 maximum · affichées comme raccourcis dans la bulle</span>
          </div>
        </section>

        <div class="lg:col-span-2 savebar">
          @if (dirty()) { <span class="mono text-xs text-warn mr-auto">● modifications non enregistrées</span> }
          <button class="btn btn-ghost" type="button" [disabled]="!dirty()" (click)="reset()">Annuler</button>
          <button class="btn btn-primary" type="submit" [disabled]="saving() || !dirty()">{{ saving() ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    } @else {
      <div class="grid gap-6 lg:grid-cols-2"><div class="skeleton h-72"></div><div class="skeleton h-72"></div></div>
    }
  `,
  styles: `
    .section-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--border);
      border-radius: 10px; background: var(--bg-solid); }
    .section-row.off { opacity: 0.5; }
    .handle { cursor: grab; color: var(--text-faint); display: inline-flex; }
    .handle:hover { color: var(--text); }
    .cdk-drag-preview { box-shadow: var(--shadow-hover); border-color: var(--accent); }
    .cdk-drag-placeholder { opacity: 0.25; }
    .cdk-drop-list-dragging .section-row:not(.cdk-drag-placeholder) { transition: transform 0.2s ease; }
    .switch { position: relative; display: inline-flex; width: 38px; height: 22px; flex-shrink: 0; cursor: pointer; }
    .switch input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
    .switch span { width: 100%; border-radius: 999px; background: var(--border-strong); transition: background 0.2s ease; position: relative; }
    .switch span::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%;
      background: #fff; transition: transform 0.2s ease; }
    .switch input:checked + span { background: var(--accent-strong); }
    .switch input:checked + span::after { transform: translateX(16px); }
    .switch input:focus-visible + span { outline: 2px solid var(--cyan); outline-offset: 2px; }
    .savebar { position: sticky; bottom: 12px; display: flex; align-items: center; justify-content: flex-end; gap: 8px;
      padding: 12px 16px; border-radius: 14px; background: var(--bg-solid); border: 1px solid var(--border); box-shadow: var(--shadow); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsEditor implements HasUnsavedChanges {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  protected readonly labels = SECTION_LABELS;
  protected readonly hints = SECTION_HINTS;
  protected readonly s = signal<SiteSettings | null>(null);
  protected readonly saving = signal(false);
  private readonly version = signal(0);
  private readonly initial = signal('');
  protected readonly dirty = computed(() => {
    this.version();
    const st = this.s();
    return !!st && JSON.stringify(st) !== this.initial();
  });

  constructor() {
    this.api.settings().subscribe((s) => this.set(s));
  }

  hasUnsavedChanges(): boolean {
    return this.dirty();
  }

  @HostListener('window:beforeunload', ['$event'])
  protected beforeUnload(event: BeforeUnloadEvent): void {
    if (this.dirty()) {
      event.preventDefault();
    }
  }

  /** ngModel modifie l'objet en place : on force le recalcul de « dirty ». */
  protected touch(): void {
    queueMicrotask(() => this.version.update((v) => v + 1));
  }

  protected isHidden(key: SectionKey): boolean {
    return this.s()!.hiddenSections.includes(key);
  }

  protected toggleHidden(key: SectionKey): void {
    const st = this.s()!;
    const hidden = st.hiddenSections.includes(key) ? st.hiddenSections.filter((k) => k !== key) : [...st.hiddenSections, key];
    this.s.set({ ...st, hiddenSections: hidden });
  }

  protected drop(event: CdkDragDrop<SectionKey[]>): void {
    const st = this.s()!;
    const order = [...st.sectionOrder];
    moveItemInArray(order, event.previousIndex, event.currentIndex);
    this.s.set({ ...st, sectionOrder: order });
  }

  protected setSuggestions(list: string[]): void {
    if (list.length > 6) {
      this.toast.info('6 questions maximum.');
    }
    this.s.set({ ...this.s()!, assistantSuggestions: list.slice(0, 6) });
  }

  protected reset(): void {
    this.set(JSON.parse(this.initial()) as SiteSettings);
  }

  protected save(): void {
    this.saving.set(true);
    this.api.saveSettings(this.s()!).subscribe({
      next: (s) => {
        this.saving.set(false);
        this.set(s);
        this.toast.success('Réglages enregistrés : la vitrine est à jour.');
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.toast.error((e.error as ApiProblem | null)?.detail ?? "L'enregistrement a échoué.");
      },
    });
  }

  private set(s: SiteSettings): void {
    const copy = { ...s, availableSections: undefined };
    delete copy.availableSections;
    this.initial.set(JSON.stringify(copy));
    this.s.set(copy);
  }
}
