package com.taleb.portfolio.publicapi;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.NotFoundException;
import com.taleb.portfolio.i18n.TranslationService;

import io.swagger.v3.oas.annotations.tags.Tag;
import tools.jackson.databind.JsonNode;

@Tag(name = "Admin · Publication & traductions", description = "Brouillon / publication de la vitrine et traductions anglaises")
@RestController
class PublicationAdminController {

	private final PublicationService publication;
	private final TranslationService translations;

	PublicationAdminController(PublicationService publication, TranslationService translations) {
		this.publication = publication;
		this.translations = translations;
	}

	@GetMapping("/api/admin/publication")
	PublicationService.Status status() {
		return publication.status();
	}

	@PostMapping("/api/admin/publication/publish")
	PublicationService.Status publish() {
		return publication.publish();
	}

	/** Aperçu du brouillon tel que les visiteurs le verront après publication. */
	@GetMapping("/api/admin/preview/portfolio")
	JsonNode previewPortfolio(@RequestParam(defaultValue = "fr") String lang) {
		return publication.preview(lang);
	}

	@GetMapping("/api/admin/preview/projects/{slug}")
	JsonNode previewProject(@PathVariable String slug, @RequestParam(defaultValue = "fr") String lang) {
		return publication.previewProject(slug, lang).orElseThrow(() -> new NotFoundException("Projet introuvable"));
	}

	@GetMapping("/api/admin/translations/{entity}/{id}")
	Map<String, Object> translations(@PathVariable String entity, @PathVariable long id) {
		return translations.get(entity, id);
	}

	@PutMapping("/api/admin/translations/{entity}/{id}")
	Map<String, Object> saveTranslations(@PathVariable String entity, @PathVariable long id,
			@RequestBody Map<String, Object> values) {
		return translations.save(entity, id, values);
	}
}
