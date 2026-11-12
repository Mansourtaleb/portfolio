package com.taleb.portfolio.content.experience;

import java.util.List;

import com.taleb.portfolio.common.SectionDto;
import com.taleb.portfolio.common.Texts;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ExperienceDto(
		Long id,
		@NotBlank(message = "Le poste est obligatoire") @Size(max = 160) String role,
		@NotBlank(message = "L'entreprise est obligatoire") @Size(max = 160) String company,
		@Size(max = 120) String location,
		@NotBlank(message = "La période est obligatoire") @Size(max = 80) String period,
		@Size(max = 60) String kind,
		@Size(max = 4000) String summary,
		List<@Size(max = 600) String> highlights,
		List<@Size(max = 80) String> stack,
		Integer sortOrder,
		Boolean visible) implements SectionDto<Experience> {

	public static ExperienceDto from(Experience e) {
		return new ExperienceDto(e.getId(), e.getRole(), e.getCompany(), e.getLocation(), e.getPeriod(), e.getKind(),
				e.getSummary(), List.copyOf(e.getHighlights()), List.copyOf(e.getStack()), e.getSortOrder(),
				e.isVisible());
	}

	@Override
	public void applyTo(Experience e) {
		e.setRole(Texts.clean(role));
		e.setCompany(Texts.clean(company));
		e.setLocation(Texts.clean(location));
		e.setPeriod(Texts.clean(period));
		e.setKind(Texts.clean(kind));
		e.setSummary(Texts.clean(summary));
		e.setHighlights(Texts.cleanList(highlights));
		e.setStack(Texts.cleanList(stack));
	}
}
