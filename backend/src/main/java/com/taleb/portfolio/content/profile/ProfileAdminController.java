package com.taleb.portfolio.content.profile;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@Tag(name = "Admin · Profil", description = "Identité et hero")
@RestController
@RequestMapping("/api/admin/profile")
class ProfileAdminController {

	private final ProfileService service;

	ProfileAdminController(ProfileService service) {
		this.service = service;
	}

	@GetMapping
	ProfileDto get() {
		return service.get();
	}

	@PutMapping
	ProfileDto update(@Valid @RequestBody ProfileDto dto) {
		return service.update(dto);
	}
}
