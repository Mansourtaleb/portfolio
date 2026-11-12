package com.taleb.portfolio.content.avatar;

import com.taleb.portfolio.common.Timestamped;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Photo de profil (ligne unique, id = 1), servie par /api/public/avatar. */
@Entity
@Table(name = "avatar_image")
public class AvatarImage extends Timestamped {

	public static final long SINGLETON_ID = 1L;

	@Id
	private Long id = SINGLETON_ID;

	@Column(name = "content_type", nullable = false, length = 40)
	private String contentType;

	@Column(name = "size_bytes", nullable = false)
	private long sizeBytes;

	@Basic(fetch = FetchType.LAZY)
	@Column(nullable = false, columnDefinition = "bytea")
	private byte[] content;

	public Long getId() {
		return id;
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

	public void replace(String contentType, byte[] content) {
		this.contentType = contentType;
		this.sizeBytes = content.length;
		this.content = content;
	}
}
