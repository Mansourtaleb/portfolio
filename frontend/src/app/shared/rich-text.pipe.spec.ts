import { RichTextPipe } from './rich-text.pipe';

/**
 * Le pipe affiche les réponses de l'assistant IA en HTML : c'est une surface d'attaque XSS.
 * Ces tests garantissent que tout HTML reçu est neutralisé et que seule la mise en forme prévue est rendue.
 */
describe('RichTextPipe', () => {
  const pipe = new RichTextPipe();

  it('renvoie une chaîne vide pour une valeur absente', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('échappe le HTML pour empêcher toute injection (XSS)', () => {
    const html = pipe.transform('<script>alert("x")</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;x&quot;');
  });

  it('neutralise un attribut événementiel malveillant', () => {
    const html = pipe.transform('<img src=x onerror=alert(1)>');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('rend le gras **texte** en <strong>', () => {
    expect(pipe.transform('Je maîtrise **Angular**')).toBe('<p>Je maîtrise <strong>Angular</strong></p>');
  });

  it('transforme les lignes « - » en liste à puces', () => {
    expect(pipe.transform('Compétences :\n- Java\n- Angular')).toBe(
      '<p>Compétences :</p><ul><li>Java</li><li>Angular</li></ul>',
    );
  });

  it('ferme la liste avant un paragraphe qui suit', () => {
    expect(pipe.transform('- un\nfin')).toBe('<ul><li>un</li></ul><p>fin</p>');
  });

  it('ignore les lignes vides', () => {
    expect(pipe.transform('a\n\nb')).toBe('<p>a</p><p>b</p>');
  });
});
