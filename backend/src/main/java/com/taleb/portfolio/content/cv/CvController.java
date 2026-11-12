package com.taleb.portfolio.content.cv;

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

import com.taleb.portfolio.content.cv.CvService.CvInfo;

@RestController
class CvController {

	private final CvService service;

	CvController(CvService service) {
		this.service = service;
	}

	/** Téléchargement public du CV. */
	@GetMapping(CvService.PUBLIC_URL)
	ResponseEntity<byte[]> download() {
		CvService.CvFile file = service.download();
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
