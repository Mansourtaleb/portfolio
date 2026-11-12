import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, input, model, signal } from '@angular/core';

import { Icon } from '../../shared/icon';

/**
 * Saisie de liste courte en étiquettes : Entrée ou virgule pour ajouter, × ou Retour arrière
 * pour supprimer, glisser-déposer pour réordonner. Un collage « a, b, c » crée trois étiquettes.
 */
@Component({
  selector: 'app-tag-input',
  imports: [Icon, CdkDropList, CdkDrag],
  template: `
    <div class="box" (click)="field.focus()" cdkDropList cdkDropListOrientation="mixed" (cdkDropListDropped)="drop($event)">
      @for (tag of value(); track tag; let i = $index) {
        <span class="tag" cdkDrag>
          <span class="mono">{{ tag }}</span>
          <button type="button" (click)="remove(i); $event.stopPropagation()" [attr.aria-label]="'Retirer ' + tag">
            <app-icon name="x" [size]="12" />
          </button>
        </span>
      }
      <input #field [id]="inputId()" class="entry" [placeholder]="value().length ? '' : placeholder()"
        [value]="draft()" (input)="draft.set(field.value)" (keydown)="onKeydown($event)" (blur)="commit()"
        (paste)="onPaste($event)" [attr.aria-label]="'Ajouter : ' + placeholder()" />
    </div>
  `,
  styles: `
    .box { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-height: 42px; padding: 6px 8px;
      background: var(--bg); border: 1px solid var(--border-strong); border-radius: var(--radius); cursor: text;
      transition: border-color 0.15s ease, box-shadow 0.15s ease; }
    .box:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 4px 3px 9px; border-radius: 999px;
      background: var(--accent-soft); color: var(--accent); font-size: 12.5px; cursor: grab; user-select: none; }
    .tag button { all: unset; cursor: pointer; display: inline-flex; padding: 2px; border-radius: 50%; }
    .tag button:hover { background: var(--accent-strong); color: #fff; }
    .entry { flex: 1; min-width: 120px; border: 0; outline: 0; background: transparent; color: var(--text);
      font: 400 14px/1.5 var(--font); padding: 3px 4px; }
    .cdk-drag-preview { box-shadow: var(--shadow-hover); }
    .cdk-drag-placeholder { opacity: 0.35; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagInput {
  readonly value = model<string[]>([]);
  readonly placeholder = input('Tapez puis Entrée');
  readonly inputId = input<string | null>(null);
  protected readonly draft = signal('');

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.commit();
    } else if (event.key === 'Backspace' && !this.draft() && this.value().length) {
      this.remove(this.value().length - 1);
    }
  }

  protected onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (/[,\n;]/.test(text)) {
      event.preventDefault();
      this.add(text.split(/[,\n;]/));
    }
  }

  protected commit(): void {
    this.add([this.draft()]);
    this.draft.set('');
  }

  protected remove(index: number): void {
    this.value.update((list) => list.filter((_, i) => i !== index));
  }

  protected drop(event: CdkDragDrop<string[]>): void {
    const list = [...this.value()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.value.set(list);
  }

  private add(raw: string[]): void {
    const current = this.value();
    const lower = new Set(current.map((t) => t.toLowerCase()));
    const next = [...current];
    for (const item of raw.map((t) => t.trim()).filter(Boolean)) {
      if (!lower.has(item.toLowerCase())) {
        lower.add(item.toLowerCase());
        next.push(item);
      }
    }
    if (next.length !== current.length) {
      this.value.set(next);
    }
    this.draft.set('');
  }
}
