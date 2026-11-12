package com.taleb.portfolio.content.project;

import java.io.IOException;
import java.time.Duration;
import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.taleb.portfolio.content.project.ProjectImageService.ImageRef;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Size;

@Tag(name = "Galerie projets", description = "Captures d'écran des projets (public + gestion admin)")
@RestController
class ProjectImageController {

	private final ProjectImageService service;

	ProjectImageController(ProjectImageService service) {
		this.service = service;
	}

	/** Image publique ; l'URL est versionnée, elle peut donc rester longtemps en cache. */
	@GetMapping("/api/public/images/{imageId}")
	ResponseEntity<byte[]> image(@PathVariable Long imageId) {
		ProjectImageService.ImageFile file = service.file(imageId);
		return ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(file.contentType()))
				.cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
				.header("X-Content-Type-Options", "nosniff")
				.body(file.content());
	}

	@GetMapping("/api/admin/projects/{projectId}/images")
	List<ImageRef> list(@PathVariable Long projectId) {
		return service.refs(projectId);
	}

	@PostMapping(path = "/api/admin/projects/{projectId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	ImageRef upload(@PathVariable Long projectId, @RequestParam("file") MultipartFile file,
			@RequestParam(required = false) @Size(max = 200) String caption,
			@RequestParam(required = false) Integer width, @RequestParam(required = false) Integer height)
			throws IOException {
		return service.upload(projectId, file, caption, width, height);
	}

	@PutMapping("/api/admin/projects/{projectId}/images/{imageId}")
	ImageRef updateCaption(@PathVariable Long projectId, @PathVariable Long imageId, @RequestBody CaptionRequest body) {
		return service.updateCaption(projectId, imageId, body.caption());
	}

	@PutMapping("/api/admin/projects/{projectId}/images/order")
	List<ImageRef> reorder(@PathVariable Long projectId, @RequestBody List<Long> orderedIds) {
		return service.reorder(projectId, orderedIds);
	}

	@DeleteMapping("/api/admin/projects/{projectId}/images/{imageId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable Long projectId, @PathVariable Long imageId) {
		service.delete(projectId, imageId);
	}

	record CaptionRequest(@Size(max = 200) String caption) {
	}
}
