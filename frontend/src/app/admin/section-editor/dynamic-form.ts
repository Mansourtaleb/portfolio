import { ChangeDetectionStrategy, Component, input, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FieldDef } from './sections';

type Draft = Record<string, any>;

/**
 * Formulaire généré à partir d'une liste de champs. Les listes sont éditées en
 * « une valeur par ligne », ce qui reste simple et rapide à saisir.
 */
@Component({
  selector: 'app-dynamic-form',
  imports: [FormsModule],
  template: `
    <form class="grid" (ngSubmit)="submit()" #f="ngForm" novalidate>
      @for (field of fields(); track field.key) {
        <div class="field" [class.wide]="field.wide || field.type === 'checkbox'">
          @switch (field.type) {
            @case ('checkbox') {
              <label class="checkbox"><input type="checkbox" [name]="field.key" [(ngModel)]="draft[field.key]" /> {{ field.label }}</label>
            }
            @case ('select') {
              <label [for]="'f-' + field.key">{{ field.label }}@if (field.required) {<span class="req"> *</span>}</label>
              <select class="select" [id]="'f-' + field.key" [name]="field.key" [(ngModel)]="draft[field.key]" [required]="!!field.required">
                @if (!field.required) { <option [ngValue]="null">—</option> }
                @for (o of field.options; track o.value) { <option [ngValue]="o.value">{{ o.label }}</option> }
              </select>
            }
            @case ('textarea') {
              <label [for]="'f-' + field.key">{{ field.label }}@if (field.required) {<span class="req"> *</span>}</label>
              <textarea class="textarea" [id]="'f-' + field.key" [name]="field.key" [rows]="field.rows ?? 3"
                [(ngModel)]="draft[field.key]" [required]="!!field.required" [class.invalid]="errors()[field.key]"></textarea>
            }
            @case ('list') {
              <label [for]="'f-' + field.key">{{ field.label }}</label>
              <textarea class="textarea mono-list" [id]="'f-' + field.key" [name]="field.key" [rows]="field.rows ?? 4"
                [(ngModel)]="draft[field.key]" [class.invalid]="errors()[field.key]"></textarea>
            }
            @default {
              <label [for]="'f-' + field.key">{{ field.label }}@if (field.required) {<span class="req"> *</span>}</label>
              <input class="input" [id]="'f-' + field.key" [name]="field.key"
                [type]="field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : 'text'"
                [attr.maxlength]="field.maxLength ?? null" [placeholder]="field.placeholder ?? ''"
                [(ngModel)]="draft[field.key]" [required]="!!field.required" [class.invalid]="errors()[field.key]" />
            }
          }
          @if (errors()[field.key]) {
            <span class="error">{{ errors()[field.key] }}</span>
          } @else if (field.hint) {
            <span class="hint">{{ field.hint }}</span>
          }
        </div>
      }
      <div class="wide actions">
        <ng-content />
        <button class="btn btn-primary" type="submit" [disabled]="saving() || f.invalid">
          {{ saving() ? 'Enregistrement…' : submitLabel() }}
        </button>
      </div>
    </form>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .wide { grid-column: 1 / -1; }
    .req { color: var(--danger); }
    .mono-list { font-family: var(--mono); font-size: 13px; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
    @media (max-width: 640px) { .grid { grid-template-columns: minmax(0, 1fr); } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicForm {
  readonly fields = input.required<FieldDef[]>();
  readonly value = input<Draft | null>(null);
  readonly saving = input(false);
  readonly errors = input<Record<string, string>>({});
  readonly submitLabel = input('Enregistrer');
  readonly save = output<Draft>();

  protected draft: Draft = {};
  private readonly version = signal(0);

  constructor() {
    effect(() => {
      const value = this.value() ?? {};
      const draft: Draft = {};
      for (const field of this.fields()) {
        const v = value[field.key];
        if (field.type === 'list') {
          draft[field.key] = Array.isArray(v) ? v.join('\n') : '';
        } else if (field.type === 'checkbox') {
          draft[field.key] = !!v;
        } else {
          draft[field.key] = v ?? (field.type === 'select' && field.required ? field.options?.[0]?.value : null);
        }
      }
      this.draft = draft;
      this.version.update((n) => n + 1);
    });
  }

  protected submit(): void {
    const result: Draft = {};
    for (const field of this.fields()) {
      const v = this.draft[field.key];
      if (field.type === 'list') {
        result[field.key] = String(v ?? '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
      } else if (field.type === 'checkbox') {
        result[field.key] = !!v;
      } else {
        result[field.key] = typeof v === 'string' ? (v.trim() || null) : v;
      }
    }
    this.save.emit(result);
  }
}
