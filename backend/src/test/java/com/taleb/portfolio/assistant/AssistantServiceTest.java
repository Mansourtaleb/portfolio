package com.taleb.portfolio.assistant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.taleb.portfolio.assistant.AssistantService.ChatTurn;

class AssistantServiceTest {

	@Test
	void historyStartsWithUserAlternatesAndEndsWithAssistant() {
		List<ChatTurn> history = List.of(
				new ChatTurn("assistant", "Bonjour !"),
				new ChatTurn("user", "Q1"),
				new ChatTurn("assistant", "R1"),
				new ChatTurn("assistant", "doublon"),
				new ChatTurn("user", "Q2"));

		List<ChatTurn> sanitized = AssistantService.sanitizedHistory(history);

		assertEquals(List.of("Q1", "R1"), sanitized.stream().map(ChatTurn::content).toList());
	}

	@Test
	void documentsAreWrappedBeforeTheQuestion() {
		KnowledgeChunk chunk = new KnowledgeChunk("project:x", "Projet", "Projet — X", "Contenu X", "/projects/x");
		String message = AssistantService.userMessage("Quelle stack ?",
				List.of(new KnowledgeIndex.ScoredChunk(chunk, 0.9)));

		assertTrue(message.startsWith("<documents>"));
		assertTrue(message.contains("Contenu X"));
		assertTrue(message.endsWith("Question : Quelle stack ?"));
	}

	@Test
	void normalizerRemovesAccentsAndStopWords() {
		List<String> terms = TextNormalizer.terms("Quelle expérience a-t-il en Sécurité ?");

		assertTrue(terms.contains("experience"));
		assertTrue(terms.contains("securite"));
		assertFalse(terms.contains("quelle"));
	}
}
