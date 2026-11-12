package com.taleb.portfolio.assistant;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import com.taleb.portfolio.config.AppProperties;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.onnx.OnnxEmbeddingModel;
import dev.langchain4j.model.embedding.onnx.PoolingMode;

/**
 * Embeddings multilingues calculés localement (paraphrase-multilingual-MiniLM-L12-v2, ONNX quantifié).
 * Aucun appel externe à l'exécution : le modèle (~120 Mo) est téléchargé une fois depuis Hugging Face
 * au premier démarrage, puis chargé depuis le disque. Tant qu'il n'est pas prêt, la recherche se fait
 * par mots-clés uniquement.
 */
@Service
class EmbeddingService {

	enum State {
		DISABLED, LOADING, READY, FAILED
	}

	record EmbeddingsReadyEvent() {
	}

	private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);

	private final AppProperties.Embeddings config;
	private final ApplicationEventPublisher events;
	private volatile OnnxEmbeddingModel model;
	private volatile State state;

	EmbeddingService(AppProperties properties, ApplicationEventPublisher events) {
		this.config = properties.assistant().embeddings();
		this.events = events;
		this.state = config.enabled() ? State.LOADING : State.DISABLED;
	}

	State state() {
		return state;
	}

	boolean isReady() {
		return state == State.READY;
	}

	/** Télécharge (si besoin) puis charge le modèle. Appelé en tâche de fond au démarrage. */
	void load() {
		if (!config.enabled()) {
			return;
		}
		try {
			Path dir = Path.of(config.modelsDir()).toAbsolutePath();
			Files.createDirectories(dir);
			Path modelFile = download(config.modelUrl(), dir.resolve("paraphrase-multilingual-MiniLM-L12-v2-q.onnx"));
			Path tokenizerFile = download(config.tokenizerUrl(),
					dir.resolve("paraphrase-multilingual-MiniLM-L12-v2-tokenizer.json"));
			long start = System.nanoTime();
			model = new OnnxEmbeddingModel(modelFile, tokenizerFile, PoolingMode.MEAN);
			state = State.READY;
			log.info("Modèle d'embeddings chargé en {} ms", Duration.ofNanos(System.nanoTime() - start).toMillis());
			events.publishEvent(new EmbeddingsReadyEvent());
		}
		catch (Exception | LinkageError e) {
			state = State.FAILED;
			log.warn("Embeddings indisponibles, recherche par mots-clés uniquement : {}", e.toString());
		}
	}

	Optional<float[]> embed(String text) {
		OnnxEmbeddingModel current = model;
		if (current == null) {
			return Optional.empty();
		}
		return Optional.of(normalized(current.embed(text).content()));
	}

	List<float[]> embedAll(List<String> texts) {
		OnnxEmbeddingModel current = model;
		if (current == null) {
			return List.of();
		}
		List<TextSegment> segments = texts.stream().map(TextSegment::from).toList();
		return current.embedAll(segments).content().stream().map(EmbeddingService::normalized).toList();
	}

	private static float[] normalized(Embedding embedding) {
		embedding.normalize();
		return embedding.vector();
	}

	private static Path download(String url, Path target) throws IOException, InterruptedException {
		if (Files.exists(target) && Files.size(target) > 0) {
			return target;
		}
		log.info("Téléchargement de {} …", url);
		HttpClient client = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NORMAL)
				.connectTimeout(Duration.ofSeconds(20)).build();
		HttpRequest request = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofMinutes(15)).GET().build();
		HttpResponse<InputStream> response = client.send(request, HttpResponse.BodyHandlers.ofInputStream());
		if (response.statusCode() != 200) {
			throw new IOException("HTTP " + response.statusCode() + " pour " + url);
		}
		Path tmp = Files.createTempFile(target.getParent(), "download-", ".part");
		try (InputStream in = response.body()) {
			Files.copy(in, tmp, StandardCopyOption.REPLACE_EXISTING);
		}
		Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
		log.info("Téléchargé : {} ({} Mo)", target.getFileName(), Files.size(target) / (1024 * 1024));
		return target;
	}
}
