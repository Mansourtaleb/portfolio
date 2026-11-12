package com.taleb.portfolio.content.knowledge;

import com.taleb.portfolio.common.SectionEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** Fiche libre lue uniquement par l'assistant IA (non affichée sur la vitrine). */
@Entity
@Table(name = "knowledge_entry")
public class KnowledgeEntry extends SectionEntity {

	@Column(nullable = false, length = 160)
	private String title;

	@Column(nullable = false, columnDefinition = "text")
	private String content;

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getContent() {
		return content;
	}

	public void setContent(String content) {
		this.content = content;
	}
}
