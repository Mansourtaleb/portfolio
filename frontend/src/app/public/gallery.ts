import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, input, signal, viewChild } from '@angular/core';

import { ProjectImage } from '../core/models';
import { TranslatePipe } from '../core/i18n';
import { Icon } from '../shared/icon';

/**
 * Galerie d'un projet : image principale + vignettes, puis visionneuse plein écran
 * (flèches du clavier, Échap pour fermer, glisser du doigt sur mobile).
 */
@Component({
  selector: 'app-gallery',
  imports: [Icon, TranslatePipe],
  template: `
    @if (images().length) {
      <div class="stage">
        <button type="button" class="main" (click)="openViewer()" [attr.aria-label]="'Agrandir : ' + (current().caption ?? 'capture ' + (index() + 1))">
          <img [src]="current().url" [alt]="current().caption ?? 'Capture d’écran du projet'" />
          <span class="zoom"><app-icon name="zoom-in" [size]="16" /> {{ 'gallery.zoom' | t }}</span>
        </button>
        @if (images().length > 1) {
          <button type="button" class="nav prev" (click)="go(-1)" aria-label="Image précédente"><app-icon name="arrow-left" [size]="18" /></button>
          <button type="button" class="nav next" (click)="go(1)" aria-label="Image suivante"><app-icon name="arrow-right" [size]="18" /></button>
        }
      </div>
      <p class="caption">
        @if (current().caption) { {{ current().caption }} }
        <span class="mono count">{{ index() + 1 }} / {{ images().length }}</span>
      </p>
      @if (images().length > 1) {
        <div class="thumbs" role="tablist" aria-label="Captures du projet">
          @for (img of images(); track img.id; let i = $index) {
            <button type="button" class="thumb" role="tab" [class.active]="i === index()" [attr.aria-selected]="i === index()"
              (click)="index.set(i)" [attr.aria-label]="img.caption ?? 'Capture ' + (i + 1)">
              <img [src]="img.url" alt="" loading="lazy" />
            </button>
          }
        </div>
      }
    }

    @if (viewerOpen()) {
      <div class="viewer" role="dialog" aria-modal="true" aria-label="Visionneuse d'images" (click)="closeViewer()"
        (touchstart)="touchStart($event)" (touchend)="touchEnd($event)">
        <button #closeBtn type="button" class="v-close" (click)="closeViewer()" aria-label="Fermer"><app-icon name="x" [size]="22" /></button>
        <figure (click)="$event.stopPropagation()">
          <img [src]="current().url" [alt]="current().caption ?? 'Capture d’écran du projet'" />
          <figcaption>
            @if (current().caption) { <span>{{ current().caption }}</span> }
            <span class="mono">{{ index() + 1 }} / {{ images().length }}</span>
          </figcaption>
        </figure>
        @if (images().length > 1) {
          <button type="button" class="v-nav v-prev" (click)="go(-1); $event.stopPropagation()" aria-label="Image précédente"><app-icon name="arrow-left" [size]="22" /></button>
          <button type="button" class="v-nav v-next" (click)="go(1); $event.stopPropagation()" aria-label="Image suivante"><app-icon name="arrow-right" [size]="22" /></button>
        }
      </div>
    }
  `,
  styles: `
    :host { display: block; }
    .stage { position: relative; border-radius: 16px; overflow: hidden; border: 1px solid var(--border); background: var(--bg-soft); }
    .main { all: unset; display: block; width: 100%; aspect-ratio: 16 / 10; cursor: zoom-in; position: relative; }
    .main img { width: 100%; height: 100%; object-fit: contain; display: block; transition: transform 0.4s ease; }
    .main:hover img { transform: scale(1.015); }
    .main:focus-visible { outline: 2px solid var(--cyan); outline-offset: -2px; }
    .zoom { position: absolute; right: 12px; bottom: 12px; display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px;
      border-radius: 999px; font-size: 12px; background: rgba(11, 15, 25, 0.7); color: #fff; opacity: 0; transition: opacity 0.2s ease; }
    .stage:hover .zoom { opacity: 1; }
    .nav { position: absolute; top: 50%; translate: 0 -50%; display: grid; place-items: center; width: 38px; height: 38px;
      border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.15); background: rgba(11, 15, 25, 0.65); color: #fff; cursor: pointer;
      opacity: 0; transition: opacity 0.2s ease, background 0.2s ease; }
    .stage:hover .nav, .nav:focus-visible { opacity: 1; }
    .nav:hover { background: var(--accent-strong); }
    .prev { left: 12px; }
    .next { right: 12px; }
    .caption { display: flex; justify-content: space-between; gap: 12px; margin-top: 10px; font-size: 14px; color: var(--text-muted); }
    .count { font-size: 12px; color: var(--text-faint); margin-left: auto; }
    .thumbs { display: flex; gap: 8px; margin-top: 10px; overflow-x: auto; padding-bottom: 4px; }
    .thumb { all: unset; flex: 0 0 96px; aspect-ratio: 16 / 10; border-radius: 8px; overflow: hidden; cursor: pointer;
      border: 2px solid transparent; opacity: 0.6; transition: opacity 0.2s ease, border-color 0.2s ease; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .thumb:hover { opacity: 1; }
    .thumb.active { opacity: 1; border-color: var(--cyan); }
    .thumb:focus-visible { outline: 2px solid var(--cyan); }
    .viewer { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 56px 72px;
      background: rgba(5, 8, 15, 0.92); backdrop-filter: blur(6px); animation: fade 0.2s ease; }
    .viewer figure { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 12px; max-width: 100%; max-height: 100%; }
    .viewer img { max-width: 100%; max-height: calc(100vh - 150px); object-fit: contain; border-radius: 10px; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5); }
    .viewer figcaption { display: flex; gap: 16px; color: #cbd5e1; font-size: 14px; }
    .v-close, .v-nav { position: absolute; display: grid; place-items: center; border: 0; cursor: pointer; color: #fff;
      background: rgba(255, 255, 255, 0.08); border-radius: 50%; transition: background 0.2s ease; }
    .v-close { top: 16px; right: 16px; width: 44px; height: 44px; }
    .v-nav { top: 50%; translate: 0 -50%; width: 48px; height: 48px; }
    .v-prev { left: 16px; }
    .v-next { right: 16px; }
    .v-close:hover, .v-nav:hover { background: var(--accent-strong); }
    @keyframes fade { from { opacity: 0; } }
    @media (max-width: 640px) { .viewer { padding: 56px 12px; } .v-nav { top: auto; bottom: 16px; translate: none; } .nav { opacity: 1; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Gallery {
  readonly images = input<ProjectImage[]>([]);
  protected readonly index = signal(0);
  protected readonly viewerOpen = signal(false);
  protected readonly current = computed(() => this.images()[Math.min(this.index(), this.images().length - 1)]);
  private readonly closeBtn = viewChild<ElementRef<HTMLButtonElement>>('closeBtn');
  private touchX = 0;
  private opener: HTMLElement | null = null;

  protected go(delta: number): void {
    const n = this.images().length;
    this.index.set((this.index() + delta + n) % n);
  }

  protected openViewer(): void {
    this.opener = document.activeElement as HTMLElement | null;
    this.viewerOpen.set(true);
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.closeBtn()?.nativeElement.focus());
  }

  protected closeViewer(): void {
    this.viewerOpen.set(false);
    document.body.style.overflow = '';
    this.opener?.focus();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    if (!this.viewerOpen()) {
      return;
    }
    if (event.key === 'Escape') {
      this.closeViewer();
    } else if (event.key === 'ArrowRight') {
      this.go(1);
    } else if (event.key === 'ArrowLeft') {
      this.go(-1);
    }
  }

  protected touchStart(event: TouchEvent): void {
    this.touchX = event.changedTouches[0].clientX;
  }

  protected touchEnd(event: TouchEvent): void {
    const dx = event.changedTouches[0].clientX - this.touchX;
    if (Math.abs(dx) > 50) {
      this.go(dx < 0 ? 1 : -1);
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }
}
