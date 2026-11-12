package com.taleb.portfolio.assistant;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Découpe un texte français/anglais en termes normalisés (minuscules, sans accents, sans mots vides). */
final class TextNormalizer {

	private static final Set<String> STOP_WORDS = Set.copyOf(java.util.List.of(
			// français
			"le", "la", "les", "un", "une", "des", "du", "de", "d", "l", "et", "ou", "en", "au", "aux", "a", "il",
			"elle", "ils", "son", "sa", "ses", "ce", "cet", "cette", "ces", "qui", "que", "quoi", "quel", "quelle",
			"quels", "quelles", "est", "sont", "pour", "par", "sur", "dans", "avec", "sans", "pas", "ne", "plus",
			"t", "y", "se", "s", "on", "nous", "vous", "je", "j", "me", "m", "mon", "ma", "mes", "lui", "leur",
			"leurs", "fait", "faire", "avez", "avoir", "etre", "peux", "peut", "parle", "moi", "comment", "quand",
			"combien", "the", "an", "of", "and", "or", "to", "in", "on", "for", "with", "is", "are", "what",
			"which", "his", "he", "does", "do", "has", "have", "about", "tell", "me", "can", "mohamed", "mansour",
			"taleb"));

	private TextNormalizer() {
	}

	static String stripAccents(String text) {
		String decomposed = Normalizer.normalize(text, Normalizer.Form.NFD);
		return decomposed.replaceAll("\\p{M}+", "");
	}

	static List<String> terms(String text) {
		List<String> terms = new ArrayList<>();
		if (text == null) {
			return terms;
		}
		String normalized = stripAccents(text.toLowerCase(Locale.ROOT));
		for (String raw : normalized.split("[^a-z0-9+#]+")) {
			if (raw.length() < 2 || STOP_WORDS.contains(raw)) {
				continue;
			}
			terms.add(stem(raw));
		}
		return terms;
	}

	/** Racinisation minimale : retire le pluriel en « s » / « x » des mots longs. */
	private static String stem(String term) {
		if (term.length() > 4 && (term.endsWith("s") || term.endsWith("x"))) {
			return term.substring(0, term.length() - 1);
		}
		return term;
	}
}
