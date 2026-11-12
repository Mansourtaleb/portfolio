package com.taleb.portfolio.content.avatar;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.taleb.portfolio.content.avatar.AvatarService.AvatarInfo;

@RestController
class AvatarController {

	private final AvatarService service;

	AvatarController(AvatarService service) {
		this.service = service;
	}

	/** Image publique ; l'URL porte un numéro de version, on peut donc la mettre en cache longtemps. */
	@GetMapping(AvatarService.PUBLIC_PATH)
	ResponseEntity<byte[]> image() {
		AvatarService.AvatarFile file = service.download();
		return ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(file.contentType()))
				.cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
				.header("X-Content-Type-Options", "nosniff")
				.body(file.content());
	}

	@GetMapping("/api/admin/avatar")
	ResponseEntity<Map<String, String>> current() {
		return service.publicUrl().map(url -> ResponseEntity.ok(Map.of("url", url)))
				.orElseGet(() -> ResponseEntity.noContent().build());
	}

	@PostMapping(path = "/api/admin/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	AvatarInfo upload(@RequestParam("file") MultipartFile file) throws IOException {
		return service.upload(file);
	}

	@DeleteMapping("/api/admin/avatar")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete() {
		service.delete();
	}
}
