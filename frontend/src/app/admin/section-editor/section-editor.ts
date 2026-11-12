import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';

import { AdminApiService } from '../../core/admin-api.service';
import { ApiProblem } from '../../core/models';
import { Icon } from '../../shared/icon';
import { DynamicForm } from './dynamic-form';
import { sectionByKey } from './sections';

type Item = { id: number; visible: boolean; sortOrder: number } & Record<string, any>;

/** Écran CRUD générique : liste, création, édition, suppression, ordre et publication d'une section. */
@Component({
  selector: 'app-section-editor',
  imports: [Icon, DynamicForm],
  template: `
    <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2"><app-icon [name]="def().icon" [size]="22" /> {{ def().title }}</h1>
        <p class="text-muted text-sm mt-1 max-w-2xl">{{ def().description }}</p>
      </div>
      @if (editing() === undefined) {
        <button class="btn btn-primary" type="button" (click)="startCreate()"><app-icon name="plus" [size]="16" /> Ajouter {{ def().singular }}</button>
      }
    </div>

    @if (notice(); as n) {
      <p class="alert mb-4" [class.alert-success]="n.ok" [class.alert-error]="!n.ok">{{ n.text }}</p>
    }

    @if (editing() !== undefined) {
      <section class="card mb-6">
        <h2 class="font-semibold mb-4">{{ editing() ? 'Modifier' : 'Ajouter' }} {{ def().singular }}</h2>
        <app-dynamic-form [fields]="def().fields" [value]="editing() ?? null" [saving]="saving()" [errors]="errors()"
          (save)="save($event)">
          <button class="btn btn-ghost" type="button" (click)="cancel()">Annuler</button>
        </app-dynamic-form>
      </section>
    }

    <section class="card p-0! overflow-hidden">
      @for (item of items(); track item.id; let first = $first; let last = $last) {
        <div class="row" [class.opacity-55]="!item.visible">
          <div class="flex flex-col">
            <button class="btn btn-ghost btn-icon h-6! w-7!" type="button" [disabled]="first || busy()" (click)="move(item, -1)" aria-label="Monter"><app-icon name="chevron-up" [size]="15" /></button>
            <button class="btn btn-ghost btn-icon h-6! w-7!" type="button" [disabled]="last || busy()" (click)="move(item, 1)" aria-label="Descendre"><app-icon name="chevron-down" [size]="15" /></button>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-semibold truncate">{{ item[def().titleField] }}
              @if (!item.visible) { <span class="chip ml-2 text-xs!">masqué</span> }
            </p>
            <p class="text-sm text-muted truncate">{{ subtitle(item) }}</p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <button class="btn btn-ghost btn-icon" type="button" (click)="toggleVisible(item)" [disabled]="busy()"
              [attr.aria-label]="item.visible ? 'Masquer' : 'Publier'" [title]="item.visible ? 'Masquer du site' : 'Publier sur le site'">
              <app-icon [name]="item.visible ? 'eye' : 'eye-off'" [size]="17" />
            </button>
            <button class="btn btn-ghost btn-icon" type="button" (click)="startEdit(item)" aria-label="Modifier" title="Modifier"><app-icon name="edit" [size]="17" /></button>
            <button class="btn btn-ghost btn-icon text-danger!" type="button" (click)="remove(item)" [disabled]="busy()" aria-label="Supprimer" title="Supprimer"><app-icon name="trash" [size]="17" /></button>
          </div>
        </div>
      } @empty {
        <p class="p-6 text-muted text-sm">Aucun élément pour l'instant.</p>
      }
    </section>
  `,
  styles: `
    .row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border);
      transition: background 0.15s ease; }
    .row:last-child { border-bottom: 0; }
    .row:hover { background: var(--bg-soft); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionEditor {
  private readonly api = inject(AdminApiService);
  /** Clé de section, fournie par les données de la route. */
  readonly section = input.required<string>();
  protected readonly def = computed(() => sectionByKey(this.section()));

  protected readonly items = signal<Item[]>([]);
  /** undefined = pas de formulaire ; null = création ; objet = édition. */
  protected readonly editing = signal<Item | null | undefined>(undefined);
  protected readonly saving = signal(false);
  protected readonly busy = signal(false);
  protected readonly errors = signal<Record<string, string>>({});
  protected readonly notice = signal<{ ok: boolean; text: string } | null>(null);

  constructor() {
    effect(() => {
      this.def();
      this.editing.set(undefined);
      this.load();
    });
  }

  protected subtitle(item: Item): string {
    return this.def()
      .subtitleFields.map((key) => (Array.isArray(item[key]) ? item[key].join(', ') : item[key]))
      .filter(Boolean)
      .join(' · ');
  }

  protected startCreate(): void {
    this.errors.set({});
    this.editing.set(null);
  }

  protected startEdit(item: Item): void {
    this.errors.set({});
    this.editing.set(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected cancel(): void {
    this.editing.set(undefined);
  }

  protected save(value: Record<string, unknown>): void {
    const current = this.editing();
    const endpoint = this.def().endpoint;
    this.saving.set(true);
    this.errors.set({});
    const request = current
      ? this.api.update<Item>(endpoint, current.id, { ...value, visible: current.visible, sortOrder: current.sortOrder })
      : this.api.create<Item>(endpoint, value);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editing.set(undefined);
        this.flash(true, current ? 'Modifications enregistrées.' : 'Élément ajouté.');
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        const problem = e.error as ApiProblem | null;
        this.errors.set(problem?.errors ?? {});
        this.flash(false, problem?.detail ?? "L'enregistrement a échoué.");
      },
    });
  }

  protected toggleVisible(item: Item): void {
    this.busy.set(true);
    this.api.update<Item>(this.def().endpoint, item.id, { ...item, visible: !item.visible }).subscribe({
      next: () => this.load(),
      error: () => this.fail('Impossible de changer la visibilité.'),
    });
  }

  protected move(item: Item, delta: number): void {
    const list = [...this.items()];
    const index = list.findIndex((i) => i.id === item.id);
    const target = index + delta;
    if (target < 0 || target >= list.length) {
      return;
    }
    [list[index], list[target]] = [list[target], list[index]];
    this.items.set(list);
    this.busy.set(true);
    this.api.reorder<Item>(this.def().endpoint, list.map((i) => i.id)).subscribe({
      next: (items) => {
        this.items.set(items);
        this.busy.set(false);
      },
      error: () => this.fail("Impossible de changer l'ordre."),
    });
  }

  protected remove(item: Item): void {
    const label = item[this.def().titleField];
    if (!confirm(`Supprimer définitivement « ${label} » ?\nPour le retirer du site sans le perdre, utilisez plutôt l'icône œil (masquer).`)) {
      return;
    }
    this.busy.set(true);
    this.api.delete(this.def().endpoint, item.id).subscribe({
      next: () => {
        this.flash(true, 'Élément supprimé.');
        this.load();
      },
      error: () => this.fail('La suppression a échoué.'),
    });
  }

  private load(): void {
    this.api.list<Item>(this.def().endpoint).subscribe({
      next: (items) => {
        this.items.set(items);
        this.busy.set(false);
      },
      error: () => this.fail('Chargement impossible.'),
    });
  }

  private fail(text: string): void {
    this.busy.set(false);
    this.flash(false, text);
    this.load();
  }

  private flash(ok: boolean, text: string): void {
    this.notice.set({ ok, text });
    setTimeout(() => this.notice.set(null), 3500);
  }
}
