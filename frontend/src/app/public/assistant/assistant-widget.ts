import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ChatSource } from '../../core/models';
import { TranslatePipe } from '../../core/i18n';
import { Avatar } from '../../shared/avatar';
import { Icon } from '../../shared/icon';
import { RichTextPipe } from '../../shared/rich-text.pipe';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  error?: boolean;
  streaming?: boolean;
  /** Identifiant + jeton renvoyés par l'API pour pouvoir donner un avis. */
  exchangeId?: number;
  feedbackToken?: string;
  feedback?: 1 | -1;
}

/**
 * Bulle de discussion avec l'assistant IA. La réponse arrive en streaming (Server-Sent Events
 * sur un POST, lus avec fetch + ReadableStream) pour s'afficher au fil de l'eau.
 */
@Component({
  selector: 'app-assistant-widget',
  imports: [FormsModule, RouterLink, Icon, RichTextPipe, Avatar, TranslatePipe],
  templateUrl: './assistant-widget.html',
  styleUrl: './assistant-widget.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssistantWidget {
  readonly greeting = input<string | null>(null);
  readonly suggestions = input<string[]>([]);
  readonly ownerName = input('');
  readonly fullName = input('');
  readonly avatarUrl = input<string | null>(null);

  protected readonly open = signal(false);
  protected readonly messages = signal<ChatMessage[]>([]);
  protected readonly busy = signal(false);
  protected question = '';

  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private readonly inputEl = viewChild<ElementRef<HTMLTextAreaElement>>('inputEl');

  constructor() {
    afterRenderEffect(() => {
      this.messages();
      const el = this.scroller()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }

  protected toggle(): void {
    this.open.update((v) => !v);
    if (this.open()) {
      setTimeout(() => this.inputEl()?.nativeElement.focus(), 50);
    }
  }

  protected isInternal(link: string): boolean {
    return link.startsWith('/');
  }

  protected fragment(link: string): string {
    return link.replace(/^#/, '');
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.ask();
    }
  }

  protected ask(text?: string): void {
    const question = (text ?? this.question).trim();
    if (!question || this.busy()) {
      return;
    }
    this.question = '';
    const history = this.messages()
      .filter((m) => !m.error && !m.streaming)
      .map((m) => ({ role: m.role, content: m.content }));
    this.messages.update((list) => [
      ...list,
      { role: 'user', content: question },
      { role: 'assistant', content: '', streaming: true },
    ]);
    this.busy.set(true);
    this.stream(question, history).finally(() => {
      this.busy.set(false);
      this.patchLast((m) => ({ ...m, streaming: false }));
    });
  }

  private async stream(question: string, history: { role: string; content: string }[]): Promise<void> {
    try {
      const response = await fetch('/api/public/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ question, history }),
      });
      if (!response.ok || !response.body) {
        let detail = "L'assistant n'est pas disponible pour le moment.";
        try {
          detail = (await response.json()).detail ?? detail;
        } catch {
          /* réponse non JSON */
        }
        this.fail(detail);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        let boundary: number;
        while ((boundary = buffer.search(/\r?\n\r?\n/)) >= 0) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary).replace(/^\r?\n\r?\n/, '');
          this.handleEvent(rawEvent);
        }
      }
    } catch {
      this.fail('Connexion interrompue. Réessayez.');
    }
  }

  private handleEvent(raw: string): void {
    let name = 'message';
    const dataLines: string[] = [];
    for (const line of raw.split(/\r?\n/)) {
      if (line.startsWith('event:')) {
        name = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).replace(/^ /, ''));
      }
    }
    if (!dataLines.length) {
      return;
    }
    let data: any;
    try {
      data = JSON.parse(dataLines.join('\n'));
    } catch {
      return;
    }
    switch (name) {
      case 'delta':
        this.patchLast((m) => ({ ...m, content: m.content + (data.text ?? '') }));
        break;
      case 'sources':
        this.patchLast((m) => ({ ...m, sources: data as ChatSource[] }));
        break;
      case 'done':
        if (data.id && data.feedbackToken) {
          this.patchLast((m) => ({ ...m, exchangeId: data.id, feedbackToken: data.feedbackToken }));
        }
        break;
      case 'error':
        this.fail(data.message ?? 'Une erreur est survenue.');
        break;
    }
  }

  /** Avis du visiteur (👍 / 👎) sur une réponse ; un seul vote par réponse. */
  protected rate(index: number, value: 1 | -1): void {
    const message = this.messages()[index];
    if (!message?.exchangeId || !message.feedbackToken || message.feedback) {
      return;
    }
    this.messages.update((list) => list.map((m, i) => (i === index ? { ...m, feedback: value } : m)));
    fetch('/api/public/assistant/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: message.exchangeId, token: message.feedbackToken, value }),
    }).catch(() => undefined);
  }

  private fail(message: string): void {
    this.patchLast((m) => ({ ...m, content: message, error: true, sources: [] }));
  }

  private patchLast(change: (m: ChatMessage) => ChatMessage): void {
    this.messages.update((list) => {
      if (!list.length) {
        return list;
      }
      const copy = [...list];
      copy[copy.length - 1] = change(copy[copy.length - 1]);
      return copy;
    });
  }
}
