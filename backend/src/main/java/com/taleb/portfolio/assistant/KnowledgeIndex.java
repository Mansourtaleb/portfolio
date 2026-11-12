package com.taleb.portfolio.assistant;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.taleb.portfolio.common.PublishedEvent;

/**
 * Index en mémoire des fiches de connaissance, reconstruit à chaque modification du contenu.
 * Recherche hybride : similarité sémantique (embeddings) + pertinence lexicale (BM25).
 * Le corpus est petit (quelques dizaines de fiches) : un index en mémoire suffit largement.
 */
@Component
public class KnowledgeIndex {

	private static final Logger log = LoggerFactory.getLogger(KnowledgeIndex.class);
	private static final double SEMANTIC_WEIGHT = 0.65;
	private static final double BM25_K1 = 1.2;
	private static final double BM25_B = 0.75;
	private static final int EMBEDDED_TEXT_MAX_CHARS = 700;

	record ScoredChunk(KnowledgeChunk chunk, double score) {
	}

	record Status(int chunks, boolean semantic, String embeddings, Instant builtAt) {
	}

	private record Entry(KnowledgeChunk chunk, Map<String, Integer> termFreq, int length, float[] vector) {
	}

	private record Snapshot(List<Entry> entries, Map<String, Integer> docFreq, double avgLength, boolean semantic,
			Instant builtAt) {

		static final Snapshot EMPTY = new Snapshot(List.of(), Map.of(), 0, false, Instant.EPOCH);
	}

	private final KnowledgeBuilder builder;
	private final EmbeddingService embeddings;
	private volatile Snapshot snapshot = Snapshot.EMPTY;

	KnowledgeIndex(KnowledgeBuilder builder, EmbeddingService embeddings) {
		this.builder = builder;
		this.embeddings = embeddings;
	}

	@EventListener(ApplicationReadyEvent.class)
	@Async
	void onStartup() {
		rebuild();
		embeddings.load(); // reconstruit l'index avec les vecteurs une fois le modèle prêt
	}

	@EventListener(EmbeddingService.EmbeddingsReadyEvent.class)
	void onEmbeddingsReady() {
		rebuild();
	}

	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
	@Async
	void onPublished(PublishedEvent event) {
		rebuild();
	}

	/** Reconstruit l'index à partir du contenu visible de la vitrine. */
	public synchronized void rebuild() {
		try {
			List<KnowledgeChunk> chunks = builder.build();
			List<float[]> vectors = embeddings.isReady()
					? embeddings.embedAll(chunks.stream().map(KnowledgeIndex::embeddedText).toList())
					: List.of();
			boolean semantic = vectors.size() == chunks.size() && !chunks.isEmpty();

			List<Entry> entries = new ArrayList<>();
			Map<String, Integer> docFreq = new HashMap<>();
			long totalLength = 0;
			for (int i = 0; i < chunks.size(); i++) {
				KnowledgeChunk chunk = chunks.get(i);
				List<String> terms = TextNormalizer.terms(chunk.title() + "\n" + chunk.text());
				Map<String, Integer> tf = new HashMap<>();
				terms.forEach(t -> tf.merge(t, 1, Integer::sum));
				tf.keySet().forEach(t -> docFreq.merge(t, 1, Integer::sum));
				totalLength += terms.size();
				entries.add(new Entry(chunk, tf, terms.size(), semantic ? vectors.get(i) : null));
			}
			double avgLength = entries.isEmpty() ? 0 : (double) totalLength / entries.size();
			snapshot = new Snapshot(List.copyOf(entries), Map.copyOf(docFreq), avgLength, semantic, Instant.now());
			log.info("Index de l'assistant reconstruit : {} fiches (recherche {})", entries.size(),
					semantic ? "hybride sémantique + mots-clés" : "par mots-clés");
		}
		catch (RuntimeException e) {
			log.error("Échec de la reconstruction de l'index de l'assistant", e);
		}
	}

	Status status() {
		Snapshot s = snapshot;
		return new Status(s.entries().size(), s.semantic(), embeddings.state().name(), s.builtAt());
	}

	/** Les {@code k} fiches les plus pertinentes ; la fiche profil est toujours incluse en premier. */
	List<ScoredChunk> search(String query, int k) {
		Snapshot s = snapshot;
		if (s.entries().isEmpty()) {
			return List.of();
		}
		List<String> queryTerms = TextNormalizer.terms(query).stream().distinct().toList();
		double[] lexical = new double[s.entries().size()];
		double maxLexical = 0;
		for (int i = 0; i < s.entries().size(); i++) {
			lexical[i] = bm25(s, s.entries().get(i), queryTerms);
			maxLexical = Math.max(maxLexical, lexical[i]);
		}
		Optional<float[]> queryVector = s.semantic() ? embeddings.embed(query) : Optional.empty();

		List<ScoredChunk> scored = new ArrayList<>();
		for (int i = 0; i < s.entries().size(); i++) {
			Entry entry = s.entries().get(i);
			double lexicalScore = maxLexical > 0 ? lexical[i] / maxLexical : 0;
			double score = queryVector.isPresent()
					? SEMANTIC_WEIGHT * dot(queryVector.get(), entry.vector()) + (1 - SEMANTIC_WEIGHT) * lexicalScore
					: lexicalScore;
			scored.add(new ScoredChunk(entry.chunk(), score));
		}
		scored.sort(Comparator.comparingDouble(ScoredChunk::score).reversed());

		List<ScoredChunk> result = new ArrayList<>();
		scored.stream().filter(c -> c.chunk().id().equals(KnowledgeBuilder.PROFILE_ID)).findFirst()
				.ifPresent(result::add);
		for (ScoredChunk candidate : scored) {
			if (result.size() >= k) {
				break;
			}
			if (!candidate.chunk().id().equals(KnowledgeBuilder.PROFILE_ID) && candidate.score() > 0) {
				result.add(candidate);
			}
		}
		return result;
	}

	private static double bm25(Snapshot s, Entry entry, List<String> queryTerms) {
		double score = 0;
		int n = s.entries().size();
		for (String term : queryTerms) {
			Integer tf = entry.termFreq().get(term);
			if (tf == null) {
				continue;
			}
			int df = s.docFreq().getOrDefault(term, 0);
			double idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
			double norm = tf * (BM25_K1 + 1)
					/ (tf + BM25_K1 * (1 - BM25_B + BM25_B * entry.length() / Math.max(1, s.avgLength())));
			score += idf * norm;
		}
		return score;
	}

	private static double dot(float[] a, float[] b) {
		if (a == null || b == null || a.length != b.length) {
			return 0;
		}
		double sum = 0;
		for (int i = 0; i < a.length; i++) {
			sum += a[i] * b[i];
		}
		return sum;
	}

	private static String embeddedText(KnowledgeChunk chunk) {
		String text = chunk.title() + "\n" + chunk.text();
		return text.length() > EMBEDDED_TEXT_MAX_CHARS ? text.substring(0, EMBEDDED_TEXT_MAX_CHARS) : text;
	}
}
