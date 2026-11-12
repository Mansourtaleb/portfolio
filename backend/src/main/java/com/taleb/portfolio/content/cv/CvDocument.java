package com.taleb.portfolio.content.cv;

import com.taleb.portfolio.common.Timestamped;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** CV PDF téléversé depuis l'admin (ligne unique, id = 1), servi par /api/public/cv. */
@Entity
@Table(name = "cv_document")
public class CvDocument extends Timestamped {

	public static final long SINGLETON_ID = 1L;

	@Id
	private Long id = SINGLETON_ID;

	@Column(name = "file_name", nullable = false, length = 200)
	private String fileName;

	@Column(name = "content_type", nullable = false, length = 100)
	private String contentType;

	@Column(name = "size_bytes", nullable = false)
	private long sizeBytes;

	@Basic(fetch = FetchType.LAZY)
	@Column(nullable = false, columnDefinition = "bytea")
	private byte[] content;

	public Long getId() {
		return id;
	}

	public String getFileName() {
		return fileName;
	}

	public String getContentType() {
		return contentType;
	}

	public long getSizeBytes() {
		return sizeBytes;
	}

	public byte[] getContent() {
		return content;
	}

	public void replace(String fileName, byte[] content) {
		this.fileName = fileName;
		this.contentType = "application/pdf";
		this.sizeBytes = content.length;
		this.content = content;
	}
}
