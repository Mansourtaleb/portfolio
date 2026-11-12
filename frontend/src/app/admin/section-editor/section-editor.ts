import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, HostListener, computed, effect, inject, input, signal } from '@angular/core';

import { AdminApiService } from '../../core/admin-api.service';
import { ApiProblem } from '../../core/models';
import { Icon } from '../../shared/icon';
import { ToastService } from '../../shared/toast';
import { HasUnsavedChanges, UNSAVED_MESSAGE } from '../../shared/unsaved-changes';
import { DynamicForm } from './dynamic-form';
import { ProjectGallery } from './project-gallery';
import { TRANSLATABLE, TranslationPanel } from './translation-panel';
import { PublicationState } from '../publication.service';
import { sectionByKey } from './sections';

type Item = { id: number; visible: boolean; sortOrder: number } & Record<string, any>;

/** Écran CRUD générique : liste, création, édition, suppression, ordre (glisser-déposer) et publication. */
@Component({
  selector: 'app-section-editor',
  imports: [Icon, DynamicForm, CdkDropList, CdkDrag, CdkDragHandle, ProjectGallery, TranslationPanel],
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

    @if (editing() !== undefined) {
      <section class="card mb-6 editor">
        <h2 class="font-semibold mb-4">{{ editing() ? 'Modifier' : 'Ajouter' }} {{ def().singular }}</h2>
        @if (editing() && translatable()) {
          <div class="lang-tabs" role="tablist" aria-label="Langue du contenu">
            <button type="button" role="tab" [class.active]="tab() === 'fr'" [attr.aria-selected]="tab() === 'fr'" (click)="switchTab('fr')">Français</button>
            <button type="button" role="tab" [class.active]="tab() === 'en'" [attr.aria-selected]="tab() === 'en'" (click)="switchTab('en')">English</button>
          </div>
        }
        @if (tab() === 'en' && editing(); as item) {
          <app-translation-panel [entity]="def().key" [entityId]="item.id" [fields]="def().fields" [french]="item"
            (dirtyChange)="dirty.set($event)">
            <button class="btn btn-ghost" type="button" (click)="cancel()">Fermer</button>
          </app-translation-panel>
        } @else {
          <app-dynamic-form [fields]="def().fields" [value]="editing() ?? null" [saving]="saving()" [errors]="errors()"
            (save)="save($event)" (dirtyChange)="dirty.set($event)">
            <button class="btn btn-ghost" type="button" (click)="cancel()">Annuler</button>
          </app-dynamic-form>
        }
      </section>
      @if (def().key === 'projects') {
        @if (editing(); as project) {
          <section class="card mb-6"><app-project-gallery [projectId]="project.id" /></section>
        } @else {
          <p class="text-sm text-faint mb-6">La galerie d'images sera disponible après le premier enregistrement du projet.</p>
        }
      }
    }

    <div class="flex items-center justify-between mb-2 text-xs text-faint">
      <span>{{ items().length }} élément(s) · {{ visibleCount() }} publié(s)</span>
      @if (items().length > 1) { <span class="hidden sm:inline">Glissez la poignée pour réordonner</span> }
    </div>
    <section class="card p-0! overflow-hidden" cdkDropList (cdkDropListDropped)="drop($event)" [cdkDropListDisabled]="busy() || !loaded()">
      @if (!loaded()) {
        @for (n of [1, 2, 3]; track n) {
          <div class="row"><div class="skeleton h-4 w-1/3"></div><div class="skeleton h-3 w-1/2 ml-4"></div></div>
        }
      }
      @for (item of items(); track item.id; let first = $first; let last = $last) {
        <div class="row" [class.hidden-item]="!item.visible" cdkDrag cdkDragLockAxis="y">
          <span class="handle" cdkDragHandle title="Glisser pour réordonner"><app-icon name="grip" [size]="18" /></span>
          <div class="flex flex-col">
            <button class="btn btn-ghost btn-icon h-5! w-6!" type="button" [disabled]="first || busy()" (click)="move(item, -1)" aria-label="Monter"><app-icon name="chevron-up" [size]="14" /></button>
            <button class="btn btn-ghost btn-icon h-5! w-6!" type="button" [disabled]="last || busy()" (click)="move(item, 1)" aria-label="Descendre"><app-icon name="chevron-down" [size]="14" /></button>
          </div>
          <button type="button" class="min-w-0 flex-1 text-left cursor-pointer bg-transparent border-0 p-0 text-fg" (click)="startEdit(item)">
            <p class="font-semibold truncate">{{ item[def().titleField] }}
              @if (!item.visible) { <span class="chip ml-2 text-xs!">masqué</span> }
            </p>
            <p class="text-sm text-muted truncate">{{ subtitle(item) }}</p>
          </button>
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
        @if (loaded()) {
          <div class="p-8 text-center">
            <p class="text-muted text-sm mb-3">Aucun élément pour l'instant.</p>
            <button class="btn btn-sm" type="button" (click)="startCreate()"><app-icon name="plus" [size]="14" /> Ajouter {{ def().singular }}</button>
          </div>
        }
      }
    </section>
  `,
  styles: `
    .row { display: flex; align-items: center; gap: 10px; padding: 10px 14px 10px 8px; border-bottom: 1px solid var(--border);
      background: var(--bg-solid); transition: background 0.15s ease; }
    .row:last-child { border-bottom: 0; }
    .row:hover { background: var(--bg-soft); }
    .hidden-item { opacity: 0.55; }
    .handle { cursor: grab; color: var(--text-faint); display: inline-flex; padding: 4px; border-radius: 6px; }
    .handle:hover { color: var(--text); background: var(--bg-soft); }
    .cdk-drag-preview { border-radius: 12px; box-shadow: var(--shadow-hover); border: 1px solid var(--accent); }
    .cdk-drag-placeholder { opacity: 0.25; }
    .cdk-drop-list-dragging .row:not(.cdk-drag-placeholder) { transition: transform 0.2s cubic-bezier(0, 0, 0.2, 1); }
    .editor { scroll-margin-top: 80px; }
    .lang-tabs { display: inline-flex; padding: 3px; gap: 2px; margin-bottom: 16px; border-radius: 10px; background: var(--bg-soft); border: 1px solid var(--border); }
    .lang-tabs button { border: 0; background: transparent; color: var(--text-muted); font: 500 13px var(--font); padding: 6px 14px; border-radius: 8px; cursor: pointer; }
    .lang-tabs button.active { background: var(--accent-strong); color: #fff; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionEditor implements HasUnsavedChanges {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  /** Clé de section, fournie par les données de la route. */
  readonly section = input.required<string>();
  protected readonly def = computed(() => sectionByKey(this.section()));
  protected readonly translatable = computed(() => !!TRANSLATABLE[this.def().key]);
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


  protected readonly items = signal<Item[]>([]);
  protected readonly loaded = signal(false);
  protected readonly visibleCount = computed(() => this.items().filter((i) => i.visible).length);
  /** undefined = pas de formulaire ; null = création ; objet = édition. */
  protected readonly editing = signal<Item | null | undefined>(undefined);
  protected readonly saving = signal(false);
  protected readonly busy = signal(false);
  protected readonly dirty = signal(false);
  protected readonly errors = signal<Record<string, string>>({});

  constructor() {
    effect(() => {
      this.def();
      this.editing.set(undefined);
      this.loaded.set(false);
      this.load();
    });
  }

  hasUnsavedChanges(): boolean {
    return this.editing() !== undefined && this.dirty();
  }

  @HostListener('window:beforeunload', ['$event'])
  protected beforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
    }
  }

  protected subtitle(item: Item): string {
    return this.def()
      .subtitleFields.map((key) => (Array.isArray(item[key]) ? item[key].join(', ') : item[key]))
      .filter(Boolean)
      .join(' · ');
  }

  protected startCreate(): void {
    this.openEditor(null);
  }

  protected startEdit(item: Item): void {
    this.openEditor(item);
  }

  protected cancel(): void {
    if (!this.dirty() || confirm(UNSAVED_MESSAGE)) {
      this.closeEditor();
    }
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
        this.closeEditor();
        this.toast.success(current ? 'Modifications enregistrées (à publier).' : 'Élément ajouté (à publier).');
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        const problem = e.error as ApiProblem | null;
        this.errors.set(problem?.errors ?? {});
        this.toast.error(problem?.detail ?? "L'enregistrement a échoué.");
      },
    });
  }

  protected toggleVisible(item: Item): void {
    this.busy.set(true);
    this.api.update<Item>(this.def().endpoint, item.id, { ...item, visible: !item.visible }).subscribe({
      next: () => {
        this.toast.success(item.visible ? 'Masqué de la vitrine.' : 'Publié sur la vitrine.');
        this.load();
      },
      error: () => this.fail('Impossible de changer la visibilité.'),
    });
  }

  protected drop(event: CdkDragDrop<Item[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const list = [...this.items()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.saveOrder(list);
  }

  protected move(item: Item, delta: number): void {
    const list = [...this.items()];
    const index = list.findIndex((i) => i.id === item.id);
    moveItemInArray(list, index, index + delta);
    this.saveOrder(list);
  }

  protected remove(item: Item): void {
    const label = item[this.def().titleField];
    if (!confirm(`Supprimer définitivement « ${label} » ?\nPour le retirer du site sans le perdre, utilisez plutôt l'icône œil (masquer).`)) {
      return;
    }
    this.busy.set(true);
    this.api.delete(this.def().endpoint, item.id).subscribe({
      next: () => {
        this.toast.success('Élément supprimé.');
        this.load();
      },
      error: () => this.fail('La suppression a échoué.'),
    });
  }

  private openEditor(item: Item | null): void {
    if (this.hasUnsavedChanges() && !confirm(UNSAVED_MESSAGE)) {
      return;
    }
    this.errors.set({});
    this.dirty.set(false);
    this.tab.set('fr');
    this.editing.set(item);
    setTimeout(() => document.querySelector('.editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  private closeEditor(): void {
    this.dirty.set(false);
    this.editing.set(undefined);
  }

  private saveOrder(list: Item[]): void {
    this.items.set(list); // affichage immédiat, puis confirmation serveur
    this.busy.set(true);
    this.api.reorder<Item>(this.def().endpoint, list.map((i) => i.id)).subscribe({
      next: (items) => {
        this.items.set(items);
        this.busy.set(false);
        this.toast.success('Ordre enregistré.');
      },
      error: () => this.fail("Impossible de changer l'ordre."),
    });
  }

  private load(): void {
    this.api.list<Item>(this.def().endpoint).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loaded.set(true);
        this.busy.set(false);
        this.publication.refresh();
      },
      error: () => {
        this.loaded.set(true);
        this.busy.set(false);
        this.toast.error('Chargement impossible.');
      },
    });
  }

  /** Affiche l'erreur et recharge la liste pour revenir à l'état réel du serveur. */
  private fail(text: string): void {
    this.toast.error(text);
    this.load();
  }
}
