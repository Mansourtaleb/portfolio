import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AdminApiService } from '../../core/admin-api.service';
import { ApiProblem, ProjectImage } from '../../core/models';
import { Icon } from '../../shared/icon';
import { resizeImage } from '../../shared/image-resize';
import { ToastService } from '../../shared/toast';

const MAX_IMAGES = 12;

/** Galerie d'un projet dans l'admin : envoi multiple, légendes, ordre par glisser-déposer, suppression. */
@Component({
  selector: 'app-project-gallery',
  imports: [Icon, CdkDropList, CdkDrag, CdkDragHandle],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h2 class="font-semibold flex items-center gap-2"><app-icon name="camera" [size]="18" /> Galerie du projet</h2>
        <p class="text-sm text-muted">Captures d'écran affichées sur la page du projet. La première sert de couverture. {{ images().length }}/{{ max }}</p>
      </div>
      <label class="btn btn-sm cursor-pointer" [class.opacity-50]="uploading() || images().length >= max">
        <app-icon name="plus" [size]="15" /> {{ uploading() ? 'Envoi ' + progress() : 'Ajouter des images' }}
        <input type="file" accept="image/png,image/jpeg,image/webp" multiple class="sr-only"
          [disabled]="uploading() || images().length >= max" (change)="upload($event)" />
      </label>
    </div>

    @if (images().length) {
      <div class="grid" cdkDropList cdkDropListOrientation="mixed" (cdkDropListDropped)="drop($event)">
        @for (img of images(); track img.id; let first = $first) {
          <figure class="tile" cdkDrag>
            <div class="thumb">
              <img [src]="img.url" [alt]="img.caption ?? 'Capture'" loading="lazy" />
              @if (first) { <span class="cover chip chip-accent">Couverture</span> }
              <span class="handle" cdkDragHandle title="Glisser pour réordonner"><app-icon name="grip" [size]="15" /></span>
              <button class="remove" type="button" (click)="remove(img)" aria-label="Supprimer l'image"><app-icon name="trash" [size]="14" /></button>
            </div>
            <input class="input caption" [value]="img.caption ?? ''" placeholder="Légende (facultatif)" maxlength="200"
              (change)="caption(img, $any($event.target).value)" (keydown.enter)="$any($event.target).blur()" />
          </figure>
        }
      </div>
    } @else {
      <label class="empty">
        <app-icon name="camera" [size]="26" />
        <span>Ajoutez des captures d'écran (JPG, PNG ou WebP) — redimensionnées automatiquement.</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" multiple class="sr-only" (change)="upload($event)" />
      </label>
    }
  `,
  styles: `
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
    .tile { margin: 0; display: flex; flex-direction: column; gap: 6px; background: var(--bg-solid); border-radius: 12px; }
    .thumb { position: relative; aspect-ratio: 16 / 10; border-radius: 10px; overflow: hidden; border: 1px solid var(--border); background: var(--bg-soft); }
    .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .cover { position: absolute; left: 6px; top: 6px; font-size: 11px; padding: 1px 8px; background: var(--bg-solid); }
    .handle, .remove { position: absolute; top: 6px; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 8px;
      background: rgba(11, 15, 25, 0.7); color: #fff; border: 0; opacity: 0; transition: opacity 0.15s ease; }
    .handle { right: 38px; cursor: grab; }
    .remove { right: 6px; cursor: pointer; }
    .remove:hover { background: var(--danger); }
    .tile:hover .handle, .tile:hover .remove, .tile:focus-within .remove { opacity: 1; }
    .caption { font-size: 13px; padding: 6px 10px; }
    .empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 28px; text-align: center; cursor: pointer;
      border: 1.5px dashed var(--border-strong); border-radius: 12px; color: var(--text-muted); font-size: 14px; }
    .empty:hover { border-color: var(--accent); color: var(--text); }
    .cdk-drag-preview { box-shadow: var(--shadow-hover); }
    .cdk-drag-placeholder { opacity: 0.3; }
    @media (hover: none) { .handle, .remove { opacity: 1; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectGallery {
  private readonly api = inject(AdminApiService);
  private readonly toast = inject(ToastService);
  readonly projectId = input.required<number>();
  protected readonly max = MAX_IMAGES;
  protected readonly images = signal<ProjectImage[]>([]);
  protected readonly uploading = signal(false);
  protected readonly progress = signal('');

  constructor() {
    effect(() => {
      const id = this.projectId();
      this.api.projectImages(id).subscribe((list) => this.images.set(list));
    });
  }

  protected async upload(event: Event): Promise<void> {
    const inputEl = event.target as HTMLInputElement;
    const files = [...(inputEl.files ?? [])].slice(0, MAX_IMAGES - this.images().length);
    inputEl.value = '';
    if (!files.length) {
      return;
    }
    this.uploading.set(true);
    let ok = 0;
    for (const [i, file] of files.entries()) {
      this.progress.set(`${i + 1}/${files.length}…`);
      try {
        if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
          throw new Error(`${file.name} : format non accepté`);
        }
        const resized = await resizeImage(file);
        const created = await firstValueFrom(
          this.api.uploadProjectImage(this.projectId(), resized.blob, resized.width, resized.height),
        );
        this.images.update((list) => [...list, created]);
        ok++;
      } catch (e) {
        const detail = e instanceof HttpErrorResponse ? (e.error as ApiProblem | null)?.detail : (e as Error).message;
        this.toast.error(detail ?? `${file.name} n'a pas pu être envoyé.`);
      }
    }
    this.uploading.set(false);
    if (ok) {
      this.toast.success(ok > 1 ? `${ok} images ajoutées.` : 'Image ajoutée.');
    }
  }

  protected caption(img: ProjectImage, value: string): void {
    this.api.updateImageCaption(this.projectId(), img.id, value).subscribe({
      next: (updated) => {
        this.images.update((list) => list.map((i) => (i.id === img.id ? updated : i)));
        this.toast.success('Légende enregistrée.');
      },
      error: () => this.toast.error("La légende n'a pas pu être enregistrée."),
    });
  }

  protected drop(event: CdkDragDrop<ProjectImage[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const list = [...this.images()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.images.set(list);
    this.api.reorderProjectImages(this.projectId(), list.map((i) => i.id)).subscribe({
      next: (saved) => {
        this.images.set(saved);
        this.toast.success('Ordre des images enregistré.');
      },
      error: () => this.toast.error("Impossible de changer l'ordre."),
    });
  }

  protected remove(img: ProjectImage): void {
    if (!confirm('Supprimer définitivement cette image ?')) {
      return;
    }
    this.api.deleteProjectImage(this.projectId(), img.id).subscribe({
      next: () => {
        this.images.update((list) => list.filter((i) => i.id !== img.id));
        this.toast.success('Image supprimée.');
      },
      error: () => this.toast.error('La suppression a échoué.'),
    });
  }
}
