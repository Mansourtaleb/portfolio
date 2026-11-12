package com.taleb.portfolio.content.project;

import java.time.Instant;

/** Métadonnées d'une capture (projection JPQL, sans les octets). */
public record ProjectImageMeta(Long id, Long projectId, String caption, Integer width, Integer height, long sizeBytes,
		Instant updatedAt) {

	/** URL publique versionnée : le cache du navigateur est invalidé dès que l'image change. */
	public String url() {
		return "/api/public/images/" + id + "?v=" + (updatedAt == null ? 0 : updatedAt.toEpochMilli());
	}
}
