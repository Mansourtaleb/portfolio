package com.taleb.portfolio.content.cv;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
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

import com.taleb.portfolio.analytics.AnalyticsService;
import com.taleb.portfolio.analytics.AnalyticsService.EventType;
import com.taleb.portfolio.content.cv.CvService.CvInfo;

import jakarta.servlet.http.HttpServletRequest;

@Tag(name = "CV PDF", description = "Téléchargement public et gestion du CV")
@RestController
class CvController {

	private final CvService service;
	private final AnalyticsService analytics;

	CvController(CvService service, AnalyticsService analytics) {
		this.service = service;
		this.analytics = analytics;
	}

	/** Téléchargement public du CV. */
	@GetMapping(CvService.PUBLIC_URL)
	ResponseEntity<byte[]> download(HttpServletRequest request) {
		CvService.CvFile file = service.download();
		analytics.record(EventType.CV_DOWNLOAD, request, CvService.PUBLIC_URL, null, request.getHeader("Referer"));
		return ResponseEntity.ok()
				.contentType(MediaType.APPLICATION_PDF)
				.header(HttpHeaders.CONTENT_DISPOSITION,
						ContentDisposition.inline().filename(file.fileName()).build().toString())
				.body(file.content());
	}

	@GetMapping("/api/admin/cv")
	ResponseEntity<CvInfo> info() {
		return service.info().map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
	}

	@PostMapping(path = "/api/admin/cv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	CvInfo upload(@RequestParam("file") MultipartFile file) throws IOException {
		return service.upload(file);
	}

	@DeleteMapping("/api/admin/cv")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete() {
		service.delete();
	}
}
