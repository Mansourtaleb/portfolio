package com.taleb.portfolio.assistant;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Questions de relance proposées après une réponse, déduites des fiches utilisées
 * (pas d'appel supplémentaire au LLM : gratuit et instantané).
 */
final class FollowUps {

	private FollowUps() {
	}

	static List<String> suggest(List<KnowledgeIndex.ScoredChunk> context, String question, String lang) {
		boolean en = "en".equals(lang);
		Set<String> result = new LinkedHashSet<>();
		String asked = question.toLowerCase(Locale.ROOT);
		for (KnowledgeIndex.ScoredChunk scored : context) {
			KnowledgeChunk c = scored.chunk();
			String subject = c.title().contains("—") ? c.title().substring(c.title().indexOf('—') + 1).strip() : c.title();
			String candidate = switch (c.section()) {
				case "Projet" -> en ? "What is the architecture of " + subject + "?" : "Quelle est l'architecture de " + subject + " ?";
				case "Expérience" -> {
					String company = subject.contains("·") ? subject.substring(subject.indexOf('·') + 1).strip() : subject;
					yield en ? "What did he achieve at " + company + "?" : "Qu'a-t-il réalisé chez " + company + " ?";
				}
				case "Compétences" -> en ? "Which projects used " + subject + "?" : "Dans quels projets a-t-il utilisé : " + subject + " ?";
				case "Formation" -> en ? "Tell me about his education." : "Parle-moi de sa formation.";
				case "Certifications" -> en ? "Which certifications does he hold?" : "Quelles certifications a-t-il obtenues ?";
				case "Langues" -> en ? "Which languages does he speak?" : "Quelles langues parle-t-il ?";
				default -> null;
			};
			if (candidate != null && !asked.contains(subject.toLowerCase(Locale.ROOT))) {
				result.add(candidate);
			}
			if (result.size() == 3) {
				break;
			}
		}
		List<String> fallback = en
				? List.of("Is he available?", "What are his main skills?", "Tell me about his AI experience.")
				: List.of("Est-il disponible ?", "Quelles sont ses compétences principales ?", "Quelle expérience a-t-il en IA ?");
		for (String f : fallback) {
			if (result.size() >= 3) {
				break;
			}
			if (!f.toLowerCase(Locale.ROOT).equals(asked.strip())) {
				result.add(f);
			}
		}
		return new ArrayList<>(result).subList(0, Math.min(3, result.size()));
	}
}
