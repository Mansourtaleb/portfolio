package com.taleb.portfolio.content.project;

import com.taleb.portfolio.common.Timestamped;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Capture d'écran d'un projet. Les octets ne sont lus que pour servir l'image (requêtes de métadonnées dédiées). */
@Entity
@Table(name = "project_image")
public class ProjectImage extends Timestamped {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "project_id", nullable = false)
	private Long projectId;

	@Column(name = "content_type", nullable = false, length = 40)
	private String contentType;

	@Column(name = "size_bytes", nullable = false)
	private long sizeBytes;

	private Integer width;

	private Integer height;

	@Column(length = 200)
	private String caption;

	@Column(nullable = false, columnDefinition = "bytea")
	private byte[] content;

	@Column(name = "sort_order", nullable = false)
	private int sortOrder;

	protected ProjectImage() {
	}

	public ProjectImage(Long projectId, String contentType, byte[] content, Integer width, Integer height,
			String caption, int sortOrder) {
		this.projectId = projectId;
		this.contentType = contentType;
		this.content = content;
		this.sizeBytes = content.length;
		this.width = width;
		this.height = height;
		this.caption = caption;
		this.sortOrder = sortOrder;
	}

	public Long getId() {
		return id;
	}

	public Long getProjectId() {
		return projectId;
	}

	public String getContentType() {
		return contentType;
	}

	public byte[] getContent() {
		return content;
	}

	public String getCaption() {
		return caption;
	}

	public void setCaption(String caption) {
		this.caption = caption;
	}

	public void setSortOrder(int sortOrder) {
		this.sortOrder = sortOrder;
	}
}
