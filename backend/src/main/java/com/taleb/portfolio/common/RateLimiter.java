package com.taleb.portfolio.common;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;

/**
 * Limiteur de débit en mémoire (Bucket4j), une file par clé (ex. adresse IP).
 * Suffisant pour une instance unique ; à remplacer par un stockage partagé si l'API est répliquée.
 */
public class RateLimiter {

	private static final int MAX_KEYS = 10_000;

	private final long capacity;
	private final Duration period;
	private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

	public RateLimiter(long capacity, Duration period) {
		this.capacity = capacity;
		this.period = period;
	}

	/** Consomme un jeton pour la clé ; lève {@link TooManyRequestsException} si la limite est atteinte. */
	public void check(String key, String message) {
		if (buckets.size() > MAX_KEYS) {
			buckets.clear();
		}
		Bucket bucket = buckets.computeIfAbsent(key, k -> Bucket.builder()
				.addLimit(Bandwidth.builder().capacity(capacity).refillGreedy(capacity, period).build())
				.build());
		if (!bucket.tryConsume(1)) {
			throw new TooManyRequestsException(message);
		}
	}
}
