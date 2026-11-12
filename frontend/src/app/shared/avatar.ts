import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

/**
 * Photo de profil ronde, avec les initiales en secours (pas de photo ou image en erreur).
 * Option « halo » : anneau en dégradé animé + pastille « disponible ».
 */
@Component({
  selector: 'app-avatar',
  template: `
    <span class="wrap" [class.halo]="halo()" [style.--size.px]="size()">
      <span class="inner">
        @if (src() && !failed()) {
          <img [src]="src()" [alt]="'Photo de ' + name()" [attr.width]="size()" [attr.height]="size()"
            loading="lazy" decoding="async" (error)="failed.set(true)" />
        } @else {
          <span class="initials" aria-hidden="true">{{ initials() }}</span>
          <span class="sr-only">{{ name() }}</span>
        }
      </span>
      @if (available()) {
        <span class="status" title="Disponible" aria-label="Disponible"></span>
      }
    </span>
  `,
  styles: `
    :host { display: inline-flex; flex-shrink: 0; }
    .wrap { position: relative; display: inline-flex; width: var(--size); height: var(--size); border-radius: 50%; }
    .inner { position: relative; z-index: 1; width: 100%; height: 100%; border-radius: 50%; overflow: hidden;
      background: linear-gradient(135deg, var(--accent-strong), var(--cyan)); display: grid; place-items: center; }
    img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .initials { color: #fff; font-weight: 800; letter-spacing: -0.02em; font-size: calc(var(--size) * 0.38); line-height: 1; }
    .halo { padding: calc(var(--size) * 0.045); }
    .halo::before { content: ''; position: absolute; inset: 0; border-radius: 50%;
      background: conic-gradient(from var(--angle, 0deg), var(--accent-strong), var(--cyan), transparent 60%, var(--accent-strong));
      animation: spin 6s linear infinite; }
    .halo::after { content: ''; position: absolute; inset: calc(var(--size) * 0.03); border-radius: 50%; background: var(--bg); }
    .halo .inner { z-index: 2; }
    .status { position: absolute; z-index: 3; right: 6%; bottom: 6%; width: max(10px, calc(var(--size) * 0.14));
      height: max(10px, calc(var(--size) * 0.14)); border-radius: 50%; background: var(--success);
      border: max(2px, calc(var(--size) * 0.025)) solid var(--bg); box-shadow: 0 0 0 0 var(--success-soft);
      animation: pulse 2.4s ease-out infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.5); } 70%, 100% { box-shadow: 0 0 0 8px rgba(52, 211, 153, 0); } }
    @media (prefers-reduced-motion: reduce) { .halo::before, .status { animation: none; } }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Avatar {
  readonly src = input<string | null | undefined>(null);
  readonly name = input('');
  readonly size = input(40);
  readonly halo = input(false);
  readonly available = input(false);
  protected readonly failed = signal(false);

  /** « Mohamed Mansour TALEB » → « MT » (prénom + nom en majuscules). */
  protected readonly initials = computed(() => {
    const words = this.name().trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      return ''; // nom pas encore chargé : simple pastille en dégradé
    }
    const last = words.find((w) => w.length > 1 && w === w.toUpperCase()) ?? words[words.length - 1];
    return (words[0][0] + (last !== words[0] ? last[0] : '')).toUpperCase();
  });
}
