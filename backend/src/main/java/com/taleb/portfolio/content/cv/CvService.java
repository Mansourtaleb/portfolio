package com.taleb.portfolio.content.cv;

import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.taleb.portfolio.common.NotFoundException;

@Service
public class CvService {

	/** URL publique du CV téléversé. */
	public static final String PUBLIC_URL = "/api/public/cv";
	static final long MAX_BYTES = 5L * 1024 * 1024;
	private static final byte[] PDF_MAGIC = { '%', 'P', 'D', 'F' };

	private final CvDocumentRepository repository;

	CvService(CvDocumentRepository repository) {
		this.repository = repository;
	}

	@Transactional(readOnly = true)
	public Optional<CvInfo> info() {
		return repository.findById(CvDocument.SINGLETON_ID).map(CvInfo::from);
	}

	@Transactional(readOnly = true)
	public boolean exists() {
		return repository.existsById(CvDocument.SINGLETON_ID);
	}

	@Transactional(readOnly = true)
	public CvFile download() {
		CvDocument doc = repository.findById(CvDocument.SINGLETON_ID)
				.orElseThrow(() -> new NotFoundException("Aucun CV publié"));
		return new CvFile(doc.getFileName(), doc.getContent());
	}

	@Transactional
	public CvInfo upload(MultipartFile file) throws IOException {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Fichier vide.");
		}
		if (file.getSize() > MAX_BYTES) {
			throw new IllegalArgumentException("Le CV ne doit pas dépasser 5 Mo.");
		}
		byte[] bytes = file.getBytes();
		if (bytes.length < PDF_MAGIC.length || !Arrays.equals(Arrays.copyOf(bytes, PDF_MAGIC.length), PDF_MAGIC)) {
			throw new IllegalArgumentException("Seuls les fichiers PDF sont acceptés.");
		}
		String name = file.getOriginalFilename() == null ? "cv.pdf"
				: file.getOriginalFilename().replaceAll("[^A-Za-z0-9._ -]", "_");
		CvDocument doc = repository.findById(CvDocument.SINGLETON_ID).orElseGet(CvDocument::new);
		doc.replace(name.isBlank() ? "cv.pdf" : name, bytes);
		return CvInfo.from(repository.saveAndFlush(doc));
	}

	@Transactional
	public void delete() {
		repository.deleteById(CvDocument.SINGLETON_ID);
	}

	public record CvInfo(String fileName, long sizeBytes, Instant updatedAt, String url) {

		static CvInfo from(CvDocument doc) {
			return new CvInfo(doc.getFileName(), doc.getSizeBytes(), doc.getUpdatedAt(), PUBLIC_URL);
		}
	}

	public record CvFile(String fileName, byte[] content) {
	}
}
