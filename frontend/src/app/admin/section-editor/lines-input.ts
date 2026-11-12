import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, ElementRef, input, model, viewChildren } from '@angular/core';

import { Icon } from '../../shared/icon';

/** Liste de phrases (réalisations, couches d'architecture…) : une ligne par élément, réordonnable. */
@Component({
  selector: 'app-lines-input',
  imports: [Icon, CdkDropList, CdkDrag, CdkDragHandle],
  template: `
    <div cdkDropList (cdkDropListDropped)="drop($event)" class="list">
      @for (line of value(); track $index; let i = $index) {
        <div class="row" cdkDrag>
          <span class="handle" cdkDragHandle title="Glisser pour réordonner"><app-icon name="grip" [size]="16" /></span>
          <input #lineInput class="input" [value]="line" [placeholder]="placeholder()"
            (input)="update(i, lineInput.value)" (keydown.enter)="$event.preventDefault(); add(i + 1)" />
          <button class="btn btn-ghost btn-icon" type="button" (click)="remove(i)" aria-label="Supprimer la ligne">
            <app-icon name="trash" [size]="15" />
          </button>
        </div>
      }
    </div>
    <button class="btn btn-sm btn-ghost add" type="button" (click)="add(value().length)">
      <app-icon name="plus" [size]="14" /> Ajouter une ligne
    </button>
  `,
  styles: `
    .list { display: flex; flex-direction: column; gap: 6px; }
    .row { display: flex; align-items: center; gap: 6px; background: var(--bg-solid); border-radius: var(--radius); }
    .handle { cursor: grab; color: var(--text-faint); display: inline-flex; padding: 4px; }
    .handle:hover { color: var(--text); }
    .add { align-self: flex-start; margin-top: 6px; }
    .cdk-drag-preview { box-shadow: var(--shadow-hover); }
    .cdk-drag-placeholder { opacity: 0.3; }
    .cdk-drop-list-dragging .row:not(.cdk-drag-placeholder) { transition: transform 0.2s ease; }
  `,
  host: { style: 'display: flex; flex-direction: column;' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinesInput {
  readonly value = model<string[]>([]);
  readonly placeholder = input('');
  private readonly inputs = viewChildren<ElementRef<HTMLInputElement>>('lineInput');

  protected update(index: number, text: string): void {
    this.value.update((list) => list.map((line, i) => (i === index ? text : line)));
  }

  protected add(index: number): void {
    this.value.update((list) => [...list.slice(0, index), '', ...list.slice(index)]);
    setTimeout(() => this.inputs()[index]?.nativeElement.focus());
  }

  protected remove(index: number): void {
    this.value.update((list) => list.filter((_, i) => i !== index));
  }

  protected drop(event: CdkDragDrop<string[]>): void {
    const list = [...this.value()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.value.set(list);
  }
}
