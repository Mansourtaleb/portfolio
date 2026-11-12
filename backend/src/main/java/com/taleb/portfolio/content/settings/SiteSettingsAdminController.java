package com.taleb.portfolio.content.settings;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@Tag(name = "Admin · Réglages", description = "Ordre des sections, thème, assistant")
@RestController
@RequestMapping("/api/admin/settings")
class SiteSettingsAdminController {

	private final SiteSettingsService service;

	SiteSettingsAdminController(SiteSettingsService service) {
		this.service = service;
	}

	@GetMapping
	SiteSettingsDto get() {
		return service.get();
	}

	@PutMapping
	SiteSettingsDto update(@Valid @RequestBody SiteSettingsDto dto) {
		return service.update(dto);
	}
}
