package com.taleb.portfolio.common;

import java.util.ArrayList;
import java.util.List;

/** Petites fonctions de nettoyage des saisies de l'espace admin. */
public final class Texts {

	private Texts() {
	}

	/** Chaîne nettoyée, ou {@code null} si vide. */
	public static String clean(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.strip();
		return trimmed.isEmpty() ? null : trimmed;
	}

	/** Liste sans éléments vides ni espaces superflus (jamais {@code null}). */
	public static List<String> cleanList(List<String> values) {
		List<String> result = new ArrayList<>();
		if (values == null) {
			return result;
		}
		for (String value : values) {
			String cleaned = clean(value);
			if (cleaned != null) {
				result.add(cleaned);
			}
		}
		return result;
	}

	public static boolean orDefault(Boolean value, boolean fallback) {
		return value == null ? fallback : value;
	}
}
