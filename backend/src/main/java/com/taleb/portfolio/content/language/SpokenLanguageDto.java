package com.taleb.portfolio.content.language;

import com.taleb.portfolio.common.SectionDto;
import com.taleb.portfolio.common.Texts;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SpokenLanguageDto(
		Long id,
		@NotBlank(message = "La langue est obligatoire") @Size(max = 60) String name,
		@NotBlank(message = "Le niveau est obligatoire") @Size(max = 80) String level,
		Integer sortOrder,
		Boolean visible) implements SectionDto<SpokenLanguage> {

	public static SpokenLanguageDto from(SpokenLanguage e) {
		return new SpokenLanguageDto(e.getId(), e.getName(), e.getLevel(), e.getSortOrder(), e.isVisible());
	}

	@Override
	public void applyTo(SpokenLanguage e) {
		e.setName(Texts.clean(name));
		e.setLevel(Texts.clean(level));
	}
}
