import { ChangeDetectionStrategy, Component, effect, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { LinesInput } from './lines-input';
import { FieldDef } from './sections';
import { TagInput } from './tag-input';

type Draft = Record<string, any>;

/**
 * Formulaire généré à partir d'une liste de champs.
 * Signale s'il contient des modifications non enregistrées (dirtyChange).
 */
@Component({
  selector: 'app-dynamic-form',
  imports: [FormsModule, TagInput, LinesInput],
  template: `
    <form class="grid" (ngSubmit)="submit()" #f="ngForm" novalidate (input)="check()" (change)="check()">
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
            @case ('tags') {
              <label [for]="'f-' + field.key">{{ field.label }}</label>
              <app-tag-input [inputId]="'f-' + field.key" [value]="draft[field.key]" (valueChange)="setList(field.key, $event)"
                [placeholder]="field.placeholder ?? 'Tapez puis Entrée'" />
            }
            @case ('lines') {
              <label>{{ field.label }}</label>
              <app-lines-input [value]="draft[field.key]" (valueChange)="setList(field.key, $event)"
                [placeholder]="field.placeholder ?? ''" />
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
        @if (dirty()) { <span class="dirty mono">● modifications non enregistrées</span> }
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
    .actions { position: sticky; bottom: 0; display: flex; align-items: center; justify-content: flex-end; gap: 8px;
      margin: 6px -22px -22px; padding: 14px 22px; background: var(--bg-solid); border-top: 1px solid var(--border);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg); z-index: 5; }
    .dirty { margin-right: auto; font-size: 12px; color: var(--warning); }
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
  readonly dirtyChange = output<boolean>();

  protected draft: Draft = {};
  protected readonly dirty = signal(false);
  private initial = '';

  constructor() {
    effect(() => {
      const value = this.value() ?? {};
      const draft: Draft = {};
      for (const field of this.fields()) {
        const v = value[field.key];
        if (field.type === 'tags' || field.type === 'lines') {
          draft[field.key] = Array.isArray(v) ? [...v] : [];
        } else if (field.type === 'checkbox') {
          draft[field.key] = !!v;
        } else {
          draft[field.key] = v ?? (field.type === 'select' && field.required ? field.options?.[0]?.value : null);
        }
      }
      this.draft = draft;
      // untracked : l'effet ne doit dépendre que de value/fields, pas de l'état « modifié ».
      untracked(() => {
        this.initial = JSON.stringify(this.normalized());
        this.setDirty(false);
      });
    });
  }

  protected setList(key: string, list: string[]): void {
    this.draft = { ...this.draft, [key]: list };
    this.check();
  }

  /** Compare le brouillon à la valeur chargée (après la mise à jour du modèle par ngModel). */
  protected check(): void {
    queueMicrotask(() => this.setDirty(JSON.stringify(this.normalized()) !== this.initial));
  }

  protected submit(): void {
    this.save.emit(this.normalized());
  }

  /** Après un enregistrement réussi, la valeur courante devient la référence. */
  markSaved(): void {
    this.initial = JSON.stringify(this.normalized());
    this.setDirty(false);
  }

  private normalized(): Draft {
    const result: Draft = {};
    for (const field of this.fields()) {
      const v = this.draft[field.key];
      if (field.type === 'tags' || field.type === 'lines') {
        result[field.key] = (v as string[]).map((s) => s.trim()).filter(Boolean);
      } else if (field.type === 'checkbox') {
        result[field.key] = !!v;
      } else {
        result[field.key] = typeof v === 'string' ? v.trim() || null : (v ?? null);
      }
    }
    return result;
  }

  private setDirty(value: boolean): void {
    if (this.dirty() !== value) {
      this.dirty.set(value);
      this.dirtyChange.emit(value);
    }
  }
}
