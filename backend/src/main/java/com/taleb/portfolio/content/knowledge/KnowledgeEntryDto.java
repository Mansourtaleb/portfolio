package com.taleb.portfolio.content.knowledge;

import com.taleb.portfolio.common.SectionDto;
import com.taleb.portfolio.common.Texts;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record KnowledgeEntryDto(
		Long id,
		@NotBlank(message = "Le titre est obligatoire") @Size(max = 160) String title,
		@NotBlank(message = "Le contenu est obligatoire") @Size(max = 6000) String content,
		Integer sortOrder,
		Boolean visible) implements SectionDto<KnowledgeEntry> {

	public static KnowledgeEntryDto from(KnowledgeEntry e) {
		return new KnowledgeEntryDto(e.getId(), e.getTitle(), e.getContent(), e.getSortOrder(), e.isVisible());
	}

	@Override
	public void applyTo(KnowledgeEntry e) {
		e.setTitle(Texts.clean(title));
		e.setContent(Texts.clean(content));
	}
}
