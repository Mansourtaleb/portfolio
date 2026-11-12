package com.taleb.portfolio.publicapi;

import java.time.LocalDate;
import java.time.ZoneOffset;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.config.AppProperties;

import io.swagger.v3.oas.annotations.tags.Tag;

/** Fichiers de référencement : plan du site (projets publiés) et règles pour les robots. */
@Tag(name = "Référencement", description = "sitemap.xml et robots.txt")
@RestController
class SeoController {

	private final PublicationService publication;
	private final String siteUrl;

	SeoController(PublicationService publication, AppProperties properties) {
		this.publication = publication;
		String url = properties.notifications().siteUrl();
		this.siteUrl = url == null || url.isBlank() ? "http://localhost:4200" : url.replaceAll("/+$", "");
	}

	@GetMapping(path = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
	ResponseEntity<String> sitemap() {
		StringBuilder xml = new StringBuilder("""
				<?xml version="1.0" encoding="UTF-8"?>
				<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
				""");
		url(xml, "/", LocalDate.now(ZoneOffset.UTC), "1.0");
		url(xml, "/cv", LocalDate.now(ZoneOffset.UTC), "0.6");
		// Seuls les projets publiés (pas les brouillons) figurent dans le plan du site.
		for (var p : publication.published("fr").withArray("projects")) {
			url(xml, "/projects/" + p.get("slug").asString(), LocalDate.now(ZoneOffset.UTC), "0.8");
		}
		xml.append("</urlset>\n");
		return ResponseEntity.ok().contentType(MediaType.APPLICATION_XML).body(xml.toString());
	}

	@GetMapping(path = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
	String robots() {
		return """
				User-agent: *
				Allow: /
				Disallow: /admin
				Disallow: /api/admin

				Sitemap: %s/sitemap.xml
				""".formatted(siteUrl);
	}

	private void url(StringBuilder xml, String path, LocalDate lastmod, String priority) {
		xml.append("  <url><loc>").append(escape(siteUrl + path)).append("</loc><lastmod>").append(lastmod)
				.append("</lastmod><priority>").append(priority).append("</priority></url>\n");
	}

	private static String escape(String value) {
		return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
	}
}
