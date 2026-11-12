package com.taleb.portfolio.content.education;

import com.taleb.portfolio.common.SectionDto;
import com.taleb.portfolio.common.Texts;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EducationDto(
		Long id,
		@NotBlank(message = "Le diplôme est obligatoire") @Size(max = 200) String degree,
		@Size(max = 200) String field,
		@NotBlank(message = "L'établissement est obligatoire") @Size(max = 160) String school,
		@Size(max = 120) String location,
		@Size(max = 80) String period,
		@Size(max = 80) String mention,
		@Size(max = 4000) String description,
		Integer sortOrder,
		Boolean visible) implements SectionDto<Education> {

	public static EducationDto from(Education e) {
		return new EducationDto(e.getId(), e.getDegree(), e.getField(), e.getSchool(), e.getLocation(), e.getPeriod(),
				e.getMention(), e.getDescription(), e.getSortOrder(), e.isVisible());
	}

	@Override
	public void applyTo(Education e) {
		e.setDegree(Texts.clean(degree));
		e.setField(Texts.clean(field));
		e.setSchool(Texts.clean(school));
		e.setLocation(Texts.clean(location));
		e.setPeriod(Texts.clean(period));
		e.setMention(Texts.clean(mention));
		e.setDescription(Texts.clean(description));
	}
}
