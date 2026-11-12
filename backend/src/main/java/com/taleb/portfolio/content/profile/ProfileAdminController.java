package com.taleb.portfolio.content.profile;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

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
