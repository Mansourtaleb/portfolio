import { Pipe, PipeTransform } from '@angular/core';

/**
 * Mise en forme minimale et sûre des réponses de l'assistant :
 * le texte est d'abord échappé, puis seuls **gras**, listes « - » et retours à la ligne sont rendus.
 */
@Pipe({ name: 'richText' })
export class RichTextPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const escaped = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const lines = escaped.split('\n');
    let html = '';
    let inList = false;
    for (const raw of lines) {
      const line = raw.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      const item = /^\s*[-•*]\s+(.*)$/.exec(line);
      if (item) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += `<li>${item[1]}</li>`;
        continue;
      }
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += line.trim() ? `<p>${line}</p>` : '';
    }
    if (inList) {
      html += '</ul>';
    }
    return html;
  }
}
