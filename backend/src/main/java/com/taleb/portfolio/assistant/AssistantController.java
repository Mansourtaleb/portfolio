package com.taleb.portfolio.assistant;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.taleb.portfolio.analytics.AnalyticsService;
import com.taleb.portfolio.analytics.AnalyticsService.EventType;
import com.taleb.portfolio.common.ClientIp;
import com.taleb.portfolio.content.settings.SiteSettingsService;

import jakarta.annotation.PreDestroy;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Tag(name = "Assistant IA", description = "Questions des visiteurs (RAG + Claude, SSE) et supervision de l'index")
@RestController
class AssistantController {

	private static final long STREAM_TIMEOUT_MS = 90_000;

	private final AssistantService assistant;
	private final KnowledgeIndex index;
	private final SiteSettingsService settings;
	private final AnalyticsService analytics;
	private final ExchangeLog exchanges;
	private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

	AssistantController(AssistantService assistant, KnowledgeIndex index, SiteSettingsService settings,
			AnalyticsService analytics, ExchangeLog exchanges) {
		this.analytics = analytics;
		this.exchanges = exchanges;
		this.assistant = assistant;
		this.index = index;
		this.settings = settings;
	}

	/** Question d'un visiteur : réponse diffusée en Server-Sent Events. */
	@PostMapping("/api/public/assistant/chat")
	SseEmitter chat(@Valid @RequestBody AssistantService.ChatRequest request, HttpServletRequest http) {
		if (!assistant.isAvailable() || !Boolean.TRUE.equals(settings.get().assistantEnabled())) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "L'assistant est désactivé.");
		}
		assistant.checkQuota(ClientIp.of(http));
		analytics.record(EventType.ASSISTANT_QUESTION, http, null, null, null);
		SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MS);
		executor.execute(() -> assistant.streamAnswer(request, emitter));
		return emitter;
	}

	/** État de l'assistant pour l'espace admin. */
	@GetMapping("/api/admin/assistant/status")
	AdminStatus status() {
		KnowledgeIndex.Status status = index.status();
		return new AdminStatus(assistant.isAvailable(), assistant.model(), status.chunks(), status.semantic(),
				status.embeddings(), status.builtAt().toString());
	}

	@PostMapping("/api/admin/assistant/reindex")
	AdminStatus reindex() {
		index.rebuild();
		return status();
	}

	/** Aperçu de la recherche RAG : quelles fiches seraient envoyées au LLM pour cette question. */
	@GetMapping("/api/admin/assistant/search")
	List<SearchHit> search(@RequestParam String q) {
		return assistant.retrieve(q).stream()
				.map(s -> new SearchHit(s.chunk().title(), s.chunk().section(), Math.round(s.score() * 1000) / 1000.0,
						s.chunk().text()))
				.toList();
	}

	/** Avis du visiteur sur une réponse : 1 (utile) ou -1 (pas utile). Le jeton est remis avec la réponse. */
	@PostMapping("/api/public/assistant/feedback")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void feedback(@Valid @RequestBody FeedbackRequest body) {
		if (!assistant.feedback(body.id(), body.token(), body.value())) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Réponse introuvable ou trop ancienne.");
		}
	}

	/** Historique des échanges pour l'admin (filtre : up, down, errors). */
	@GetMapping("/api/admin/assistant/exchanges")
	ExchangeLog.Page exchanges(@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size, @RequestParam(required = false) String filter) {
		return exchanges.page(Math.max(0, page), Math.max(1, Math.min(size, 100)), filter);
	}

	@DeleteMapping("/api/admin/assistant/exchanges/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void deleteExchange(@PathVariable long id) {
		exchanges.delete(id);
	}

	@PreDestroy
	void shutdown() {
		executor.shutdown();
	}

	record FeedbackRequest(@NotNull Long id, @NotBlank @Size(max = 36) String token,
			@Min(-1) @Max(1) int value) {
	}

	record AdminStatus(boolean apiKeyConfigured, String model, int chunks, boolean semanticSearch, String embeddings,
			String indexedAt) {
	}

	record SearchHit(String title, String section, double score, String text) {
	}
}
