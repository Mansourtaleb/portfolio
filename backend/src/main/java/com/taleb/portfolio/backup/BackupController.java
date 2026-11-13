package com.taleb.portfolio.backup;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Admin · Sauvegarde", description = "Export / import du contenu en JSON")
@RestController
class BackupController {

	private final BackupService backups;

	BackupController(BackupService backups) {
		this.backups = backups;
	}

	@GetMapping("/api/admin/backup")
	ResponseEntity<Map<String, Object>> export() {
		String name = "portfolio-sauvegarde-" + LocalDate.now() + ".json";
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(name).build().toString())
				.body(backups.export());
	}

	/** Restaure le contenu (reste en brouillon : à vérifier puis publier). */
	@PostMapping("/api/admin/backup/restore")
	Map<String, Integer> restore(@RequestBody Map<String, Object> backup) {
		return backups.restore(backup);
	}
}
