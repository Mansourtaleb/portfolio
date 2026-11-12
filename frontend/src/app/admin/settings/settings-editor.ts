import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminApiService } from '../../core/admin-api.service';
import { ApiProblem, SectionKey, SiteSettings } from '../../core/models';
import { SECTION_LABELS } from '../../public/home/home';
import { Icon } from '../../shared/icon';

/** Ordre et visibilité des sections, thème par défaut, SEO, assistant et formulaire de contact. */
@Component({
  selector: 'app-settings-editor',
  imports: [FormsModule, Icon],
  template: `
    <h1 class="text-2xl font-bold flex items-center gap-2 mb-1"><app-icon name="settings" [size]="22" /> Sections &amp; réglages</h1>
    <p class="text-muted text-sm mb-6">Organisation de la page d'accueil et options globales du site.</p>

    @if (s(); as st) {
      <form (ngSubmit)="save()" class="grid gap-6 lg:grid-cols-2">
        <section class="card">
          <h2 class="font-semibold mb-4">Ordre des sections</h2>
          <ul class="space-y-2">
            @for (key of st.sectionOrder; track key; let first = $first; let last = $last; let i = $index) {
              <li class="flex items-center gap-3 rounded-lg border border-line px-3 py-2" [class.opacity-55]="isHidden(key)">
                <span class="mono text-xs text-faint w-5">{{ i + 1 }}</span>
                <span class="flex-1 font-medium">{{ labels[key] }}</span>
                <label class="checkbox text-sm"><input type="checkbox" [checked]="!isHidden(key)" (change)="toggleHidden(key)" /> visible</label>
                <button class="btn btn-ghost btn-icon h-8! w-8!" type="button" [disabled]="first" (click)="move(i, -1)" aria-label="Monter"><app-icon name="chevron-up" [size]="15" /></button>
                <button class="btn btn-ghost btn-icon h-8! w-8!" type="button" [disabled]="last" (click)="move(i, 1)" aria-label="Descendre"><app-icon name="chevron-down" [size]="15" /></button>
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
            <textarea id="sg" class="textarea mono text-sm" name="suggestions" rows="4" [(ngModel)]="suggestionsText"></textarea>
            <span class="hint">Une question par ligne (6 maximum)</span>
          </div>
        </section>

        <div class="lg:col-span-2 flex items-center justify-end gap-3">
          @if (notice(); as n) { <p class="alert" [class.alert-success]="n.ok" [class.alert-error]="!n.ok">{{ n.text }}</p> }
          <button class="btn btn-primary" type="submit" [disabled]="saving()">{{ saving() ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </form>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsEditor {
  private readonly api = inject(AdminApiService);
  protected readonly labels = SECTION_LABELS;
  protected readonly s = signal<SiteSettings | null>(null);
  protected readonly saving = signal(false);
  protected readonly notice = signal<{ ok: boolean; text: string } | null>(null);
  protected suggestionsText = '';

  constructor() {
    this.api.settings().subscribe((s) => this.set(s));
  }

  protected isHidden(key: SectionKey): boolean {
    return this.s()!.hiddenSections.includes(key);
  }

  protected toggleHidden(key: SectionKey): void {
    const st = this.s()!;
    const hidden = st.hiddenSections.includes(key)
      ? st.hiddenSections.filter((k) => k !== key)
      : [...st.hiddenSections, key];
    this.s.set({ ...st, hiddenSections: hidden });
  }

  protected move(index: number, delta: number): void {
    const st = this.s()!;
    const order = [...st.sectionOrder];
    [order[index], order[index + delta]] = [order[index + delta], order[index]];
    this.s.set({ ...st, sectionOrder: order });
  }

  protected save(): void {
    const st = this.s()!;
    const assistantSuggestions = this.suggestionsText.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 6);
    this.saving.set(true);
    this.api.saveSettings({ ...st, assistantSuggestions }).subscribe({
      next: (s) => {
        this.saving.set(false);
        this.set(s);
        this.notice.set({ ok: true, text: 'Réglages enregistrés.' });
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.notice.set({ ok: false, text: (e.error as ApiProblem | null)?.detail ?? "L'enregistrement a échoué." });
      },
    });
  }

  private set(s: SiteSettings): void {
    this.s.set(s);
    this.suggestionsText = s.assistantSuggestions.join('\n');
  }
}
