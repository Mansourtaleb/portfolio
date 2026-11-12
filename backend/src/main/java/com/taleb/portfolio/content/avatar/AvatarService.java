package com.taleb.portfolio.content.avatar;

import java.io.IOException;
import java.time.Instant;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.taleb.portfolio.common.ImageTypes;
import com.taleb.portfolio.common.NotFoundException;

/**
 * Photo de profil. Le recadrage, le zoom et la conversion en WebP 512×512 sont faits dans le
 * navigateur ; le serveur vérifie la taille et le vrai format du fichier (octets de signature).
 */
@Service
public class AvatarService {

	static final String PUBLIC_PATH = "/api/public/avatar";
	static final long MAX_BYTES = 2L * 1024 * 1024;

	private final AvatarImageRepository repository;

	AvatarService(AvatarImageRepository repository) {
		this.repository = repository;
	}

	/** URL publique avec un numéro de version : le navigateur recharge l'image dès qu'elle change. */
	@Transactional(readOnly = true)
	public Optional<String> publicUrl() {
		return repository.findById(AvatarImage.SINGLETON_ID).map(AvatarService::versionedUrl);
	}

	@Transactional(readOnly = true)
	public AvatarFile download() {
		AvatarImage image = repository.findById(AvatarImage.SINGLETON_ID)
				.orElseThrow(() -> new NotFoundException("Aucune photo de profil"));
		return new AvatarFile(image.getContentType(), image.getContent());
	}

	@Transactional
	public AvatarInfo upload(MultipartFile file) throws IOException {
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Fichier vide.");
		}
		if (file.getSize() > MAX_BYTES) {
			throw new IllegalArgumentException("La photo ne doit pas dépasser 2 Mo.");
		}
		byte[] bytes = file.getBytes();
		String contentType = ImageTypes.detect(bytes)
				.orElseThrow(() -> new IllegalArgumentException("Formats acceptés : WebP, PNG ou JPEG."));
		AvatarImage image = repository.findById(AvatarImage.SINGLETON_ID).orElseGet(AvatarImage::new);
		image.replace(contentType, bytes);
		AvatarImage saved = repository.saveAndFlush(image);
		return new AvatarInfo(saved.getContentType(), saved.getSizeBytes(), saved.getUpdatedAt(), versionedUrl(saved));
	}

	@Transactional
	public void delete() {
		repository.deleteById(AvatarImage.SINGLETON_ID);
	}

	private static String versionedUrl(AvatarImage image) {
		Instant version = image.getUpdatedAt() != null ? image.getUpdatedAt() : Instant.now();
		return PUBLIC_PATH + "?v=" + version.toEpochMilli();
	}

	public record AvatarInfo(String contentType, long sizeBytes, Instant updatedAt, String url) {
	}

	public record AvatarFile(String contentType, byte[] content) {
	}
}
