package com.taleb.portfolio.assistant;

/**
 * Fiche de connaissance indexée par l'assistant.
 *
 * @param id identifiant stable (ex. {@code project:financauto})
 * @param section section d'origine (profil, projet, expérience…)
 * @param title titre lisible, affiché comme source
 * @param text contenu complet transmis au LLM
 * @param link lien interne vers l'élément sur la vitrine (peut être {@code null})
 */
public record KnowledgeChunk(String id, String section, String title, String text, String link) {
}
