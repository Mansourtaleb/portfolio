import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';

import { AdminApiService } from '../../core/admin-api.service';
import { ApiProblem } from '../../core/models';
import { ToastService } from '../../shared/toast';
import { PublicationState } from '../publication.service';
import { DynamicForm } from './dynamic-form';
import { FieldDef } from './sections';

/** Champs traduisibles par type de contenu (doit correspondre à TranslationService côté API). */
export const TRANSLATABLE: Record<string, string[]> = {
  profile: ['headline', 'tagline', 'summary', 'location', 'availability', 'qualities', 'extras'],
  settings: ['siteTitle', 'metaDescription', 'assistantGreeting', 'assistantSuggestions'],
  skills: ['name', 'items'],
  experiences: ['role', 'location', 'period', 'kind', 'summary', 'highlights'],
  projects: ['title', 'tagline', 'context', 'period', 'summary', 'description', 'role', 'highlights', 'architecture', 'confidentialNote'],
  education: ['degree', 'field', 'location', 'period', 'mention', 'description'],
  certifications: ['name', 'issuedOn'],
  languages: ['name', 'level'],
  testimonials: ['role', 'relationship', 'quote'],
};

/**
 * Onglet « English » d'un formulaire : mêmes champs que la version française, sans contrainte
 * d'obligation ; chaque champ affiche le texte français en aide. Un champ vide = repli sur le français.
 */
@Component({
  selector: 'app-translation-panel',
  imports: [DynamicForm],
  template: `
    <p class="text-sm text-muted mb-4">
      Traduction anglaise affichée quand le visiteur choisit <strong class="mono">EN</strong>.
      Laissez un champ vide pour réutiliser le texte français.
    </p>
    @if (loaded()) {
      <app-dynamic-form [fields]="enFields()" [value]="values()" [saving]="saving()" [errors]="errors()"
        submitLabel="Enregistrer la traduction" (save)="save($event)" (dirtyChange)="dirtyChange.emit($event)">
        <ng-content />
      </app-dynamic-form>
    } @else {
      <div class="skeleton h-40"></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranslationPanel {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  private readonly publication = inject(PublicationState);

  readonly entity = input.required<string>();
  readonly entityId = input.required<number>();
  readonly fields = input.required<FieldDef[]>();
  /** Valeurs françaises, affichées en aide sous chaque champ. */
  readonly french = input<Record<string, unknown> | null>(null);
  readonly dirtyChange = output<boolean>();

  protected readonly values = signal<Record<string, unknown>>({});
  protected readonly loaded = signal(false);
  protected readonly saving = signal(false);
  protected readonly errors = signal<Record<string, string>>({});

  protected readonly enFields = computed<FieldDef[]>(() => {
    const allowed = TRANSLATABLE[this.entity()] ?? [];
    const fr = this.french() ?? {};
    return this.fields()
      .filter((f) => allowed.includes(f.key))
      .map((f) => {
        const original = fr[f.key];
        const text = Array.isArray(original) ? original.join(' · ') : (original as string | null);
        return { ...f, required: false, label: `${f.label} (EN)`, placeholder: '', hint: text ? `FR : ${truncate(text)}` : 'Pas de texte français' };
      });
  });

  constructor() {
    effect(() => {
      const entity = this.entity();
      const id = this.entityId();
      this.loaded.set(false);
      this.api.translations(entity, id).subscribe((v) => {
        this.values.set(v);
        this.loaded.set(true);
      });
    });
  }

  protected save(value: Record<string, unknown>): void {
    this.saving.set(true);
    this.api.saveTranslations(this.entity(), this.entityId(), value).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.values.set(saved);
        this.toast.success('Traduction anglaise enregistrée (à publier).');
        this.publication.refresh();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.toast.error((e.error as ApiProblem | null)?.detail ?? "La traduction n'a pas pu être enregistrée.");
      },
    });
  }
}

function truncate(text: string): string {
  return text.length > 140 ? text.slice(0, 140) + '…' : text;
}
