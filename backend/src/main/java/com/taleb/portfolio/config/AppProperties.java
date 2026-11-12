package com.taleb.portfolio.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Configuration applicative typée (préfixe {@code app}). */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Security security, Assistant assistant) {

	public record Security(
			String jwtSecret,
			Duration jwtTtl,
			String adminUsername,
			String adminPassword,
			List<String> corsAllowedOrigins) {
	}

	public record Assistant(
			String apiKey,
			String model,
			long maxTokens,
			int topK,
			int maxQuestionLength,
			int requestsPerMinutePerIp,
			int requestsPerDay,
			Embeddings embeddings) {

		public boolean hasApiKey() {
			return apiKey != null && !apiKey.isBlank();
		}
	}

	public record Embeddings(boolean enabled, String modelsDir, String modelUrl, String tokenizerUrl) {
	}
}
