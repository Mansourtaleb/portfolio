package com.taleb.portfolio.assistant;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class FollowUpsTest {

	private static KnowledgeIndex.ScoredChunk chunk(String section, String title) {
		return new KnowledgeIndex.ScoredChunk(new KnowledgeChunk(section + title, section, title, "…", null), 1);
	}

	@Test
	void suggestsQuestionsFromUsedChunksInTheSiteLanguage() {
		var context = List.of(chunk("Profil", "Profil — X"), chunk("Projet", "Projet — FinancAuto"),
				chunk("Expérience", "Expérience — Stagiaire · Teamwill"));

		assertThat(FollowUps.suggest(context, "Parle-moi de ses compétences", "fr"))
				.hasSize(3)
				.contains("Quelle est l'architecture de FinancAuto ?", "Qu'a-t-il réalisé chez Teamwill ?");
		assertThat(FollowUps.suggest(context, "Tell me about his skills", "en"))
				.contains("What is the architecture of FinancAuto?");
	}

	@Test
	void doesNotSuggestTheSubjectAlreadyAsked() {
		var context = List.of(chunk("Projet", "Projet — FinancAuto"));
		assertThat(FollowUps.suggest(context, "Parle-moi de FinancAuto", "fr"))
				.noneMatch(q -> q.contains("FinancAuto"))
				.hasSize(3);
	}
}
