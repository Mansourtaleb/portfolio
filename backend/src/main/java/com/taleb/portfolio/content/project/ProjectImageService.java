package com.taleb.portfolio.content.project;

import java.io.IOException;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.taleb.portfolio.common.ImageTypes;
import com.taleb.portfolio.common.NotFoundException;
import com.taleb.portfolio.common.Texts;

/** Galerie d'un projet : ajout, légende, ordre et suppression des captures. */
@Service
public class ProjectImageService {

	static final long MAX_BYTES = 3L * 1024 * 1024;
	static final int MAX_IMAGES_PER_PROJECT = 12;

	private final ProjectImageRepository images;
	private final ProjectRepository projects;

	ProjectImageService(ProjectImageRepository images, ProjectRepository projects) {
		this.images = images;
		this.projects = projects;
	}

	@Transactional(readOnly = true)
	public List<ImageRef> refs(Long projectId) {
		return images.findMeta(projectId).stream().map(ImageRef::from).toList();
	}

	@Transactional
	public ImageRef upload(Long projectId, MultipartFile file, String caption, Integer width, Integer height)
			throws IOException {
		if (!projects.existsById(projectId)) {
			throw new NotFoundException("Projet introuvable");
		}
		if (images.countByProject(projectId) >= MAX_IMAGES_PER_PROJECT) {
			throw new IllegalArgumentException("Maximum " + MAX_IMAGES_PER_PROJECT + " images par projet.");
		}
		if (file == null || file.isEmpty()) {
			throw new IllegalArgumentException("Fichier vide.");
		}
		if (file.getSize() > MAX_BYTES) {
			throw new IllegalArgumentException("Image trop lourde (3 Mo maximum).");
		}
		byte[] bytes = file.getBytes();
		String type = ImageTypes.detect(bytes)
				.orElseThrow(() -> new IllegalArgumentException("Formats acceptés : WebP, PNG ou JPEG."));
		ProjectImage image = images.saveAndFlush(new ProjectImage(projectId, type, bytes, positive(width),
				positive(height), Texts.clean(caption), images.maxSortOrder(projectId) + 1));
		return ImageRef.from(meta(image));
	}

	@Transactional
	public ImageRef updateCaption(Long projectId, Long imageId, String caption) {
		ProjectImage image = load(projectId, imageId);
		image.setCaption(Texts.clean(caption));
		return ImageRef.from(meta(images.saveAndFlush(image)));
	}

	@Transactional
	public List<ImageRef> reorder(Long projectId, List<Long> orderedIds) {
		for (int i = 0; i < orderedIds.size(); i++) {
			images.updateSortOrder(projectId, orderedIds.get(i), i + 1);
		}
		return refs(projectId);
	}

	@Transactional
	public void delete(Long projectId, Long imageId) {
		images.delete(load(projectId, imageId));
	}

	@Transactional(readOnly = true)
	public ImageFile file(Long imageId) {
		ProjectImage image = images.findById(imageId).orElseThrow(() -> new NotFoundException("Image introuvable"));
		return new ImageFile(image.getContentType(), image.getContent());
	}

	private ProjectImage load(Long projectId, Long imageId) {
		return images.findById(imageId).filter(i -> i.getProjectId().equals(projectId))
				.orElseThrow(() -> new NotFoundException("Image introuvable"));
	}

	private static ProjectImageMeta meta(ProjectImage i) {
		return new ProjectImageMeta(i.getId(), i.getProjectId(), i.getCaption(), null, null, i.getContent().length,
				i.getUpdatedAt());
	}

	private static Integer positive(Integer value) {
		return value != null && value > 0 && value < 20_000 ? value : null;
	}

	/** Référence d'image exposée dans l'API (sans les octets). */
	public record ImageRef(Long id, String url, String caption) {

		static ImageRef from(ProjectImageMeta m) {
			return new ImageRef(m.id(), m.url(), m.caption());
		}
	}

	public record ImageFile(String contentType, byte[] content) {
	}
}
