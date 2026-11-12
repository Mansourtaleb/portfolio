import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { Icon } from '../../shared/icon';

const STAGE = 280;
const OUTPUT = 512;
const MAX_ZOOM = 4;

/**
 * Recadrage de la photo de profil : glisser pour cadrer, molette ou curseur pour zoomer.
 * Export carré 512×512 en WebP (PNG si le navigateur ne sait pas encoder le WebP).
 */
@Component({
  selector: 'app-avatar-cropper',
  imports: [Icon],
  template: `
    <div class="cropper">
      <div class="stage" [style.width.px]="stage" [style.height.px]="stage"
        (pointerdown)="startDrag($event)" (pointermove)="drag($event)" (pointerup)="endDrag($event)"
        (pointercancel)="endDrag($event)" (wheel)="onWheel($event)" (keydown)="onKey($event)" tabindex="0"
        aria-label="Zone de recadrage : flèches pour déplacer, + et − pour zoomer">
        @if (image(); as img) {
          <img [src]="img.src" alt="" draggable="false"
            [style.width.px]="img.naturalWidth * scale()" [style.height.px]="img.naturalHeight * scale()"
            [style.left.px]="left()" [style.top.px]="top()" />
        }
        <div class="mask" aria-hidden="true"></div>
      </div>
      <div class="zoom">
        <app-icon name="zoom-out" [size]="16" />
        <input type="range" min="1" [max]="maxZoom" step="0.01" [value]="zoom()" (input)="setZoom(+$any($event.target).value)"
          aria-label="Zoom" />
        <app-icon name="zoom-in" [size]="16" />
      </div>
      <p class="hint">Glissez pour cadrer · molette ou curseur pour zoomer</p>
      <div class="actions">
        <button class="btn btn-ghost" type="button" (click)="cancel.emit()">Annuler</button>
        <button class="btn btn-primary" type="button" [disabled]="busy()" (click)="export()">
          {{ busy() ? 'Envoi…' : 'Enregistrer la photo' }}
        </button>
      </div>
    </div>
  `,
  styles: `
    .cropper { display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .stage { position: relative; overflow: hidden; border-radius: 16px; background: var(--bg-soft); cursor: grab;
      touch-action: none; user-select: none; outline-offset: 4px; }
    .stage:active { cursor: grabbing; }
    img { position: absolute; max-width: none; pointer-events: none; }
    .mask { position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 0 999px rgba(11, 15, 25, 0.62);
      outline: 2px solid rgba(255, 255, 255, 0.7); outline-offset: -2px; pointer-events: none; }
    .zoom { display: flex; align-items: center; gap: 10px; width: 280px; color: var(--text-muted); }
    .zoom input { flex: 1; accent-color: var(--accent-strong); }
    .hint { font-size: 12px; color: var(--text-faint); }
    .actions { display: flex; gap: 8px; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarCropper {
  readonly file = input.required<File>();
  readonly busy = input(false);
  readonly cropped = output<Blob>();
  readonly cancel = output<void>();

  protected readonly stage = STAGE;
  protected readonly maxZoom = MAX_ZOOM;
  protected readonly image = signal<HTMLImageElement | null>(null);
  protected readonly zoom = signal(1);
  private readonly offset = signal({ x: 0, y: 0 });
  private dragStart: { x: number; y: number; ox: number; oy: number } | null = null;

  /** Échelle « couvrir » : le plus petit zoom qui remplit toute la zone. */
  private readonly baseScale = computed(() => {
    const img = this.image();
    return img ? Math.max(STAGE / img.naturalWidth, STAGE / img.naturalHeight) : 1;
  });
  protected readonly scale = computed(() => this.baseScale() * this.zoom());
  protected readonly left = computed(() => {
    const img = this.image();
    return img ? STAGE / 2 + this.offset().x - (img.naturalWidth * this.scale()) / 2 : 0;
  });
  protected readonly top = computed(() => {
    const img = this.image();
    return img ? STAGE / 2 + this.offset().y - (img.naturalHeight * this.scale()) / 2 : 0;
  });

  ngOnInit(): void {
    const url = URL.createObjectURL(this.file());
    const img = new Image();
    img.onload = () => this.image.set(img);
    img.src = url;
  }

  ngOnDestroy(): void {
    const img = this.image();
    if (img) {
      URL.revokeObjectURL(img.src);
    }
  }

  protected setZoom(value: number): void {
    this.zoom.set(Math.min(MAX_ZOOM, Math.max(1, value)));
    this.setOffset(this.offset().x, this.offset().y);
  }

  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.setZoom(this.zoom() * (event.deltaY < 0 ? 1.08 : 1 / 1.08));
  }

  protected onKey(event: KeyboardEvent): void {
    const step = 10;
    const { x, y } = this.offset();
    const moves: Record<string, () => void> = {
      ArrowLeft: () => this.setOffset(x + step, y),
      ArrowRight: () => this.setOffset(x - step, y),
      ArrowUp: () => this.setOffset(x, y + step),
      ArrowDown: () => this.setOffset(x, y - step),
      '+': () => this.setZoom(this.zoom() + 0.1),
      '-': () => this.setZoom(this.zoom() - 0.1),
    };
    if (moves[event.key]) {
      event.preventDefault();
      moves[event.key]();
    }
  }

  protected startDrag(event: PointerEvent): void {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.dragStart = { x: event.clientX, y: event.clientY, ox: this.offset().x, oy: this.offset().y };
  }

  protected drag(event: PointerEvent): void {
    if (this.dragStart) {
      this.setOffset(this.dragStart.ox + event.clientX - this.dragStart.x, this.dragStart.oy + event.clientY - this.dragStart.y);
    }
  }

  protected endDrag(event: PointerEvent): void {
    this.dragStart = null;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
  }

  protected export(): void {
    const img = this.image();
    if (!img) {
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d')!;
    const ratio = OUTPUT / STAGE;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, this.left() * ratio, this.top() * ratio, img.naturalWidth * this.scale() * ratio,
      img.naturalHeight * this.scale() * ratio);
    canvas.toBlob((blob) => blob && this.cropped.emit(blob), 'image/webp', 0.9);
  }

  /** Empêche de laisser un bord vide dans la zone de recadrage. */
  private setOffset(x: number, y: number): void {
    const img = this.image();
    if (!img) {
      return;
    }
    const maxX = Math.max(0, (img.naturalWidth * this.scale() - STAGE) / 2);
    const maxY = Math.max(0, (img.naturalHeight * this.scale() - STAGE) / 2);
    this.offset.set({ x: Math.min(maxX, Math.max(-maxX, x)), y: Math.min(maxY, Math.max(-maxY, y)) });
  }
}
