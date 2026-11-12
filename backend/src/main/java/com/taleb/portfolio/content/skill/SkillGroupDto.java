package com.taleb.portfolio.content.skill;

import java.util.List;

import com.taleb.portfolio.common.SectionDto;
import com.taleb.portfolio.common.Texts;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SkillGroupDto(
		Long id,
		@NotBlank(message = "Le nom est obligatoire") @Size(max = 120) String name,
		@Size(max = 60) String icon,
		List<@Size(max = 120) String> items,
		Integer sortOrder,
		Boolean visible) implements SectionDto<SkillGroup> {

	public static SkillGroupDto from(SkillGroup e) {
		return new SkillGroupDto(e.getId(), e.getName(), e.getIcon(), List.copyOf(e.getItems()), e.getSortOrder(),
				e.isVisible());
	}

	@Override
	public void applyTo(SkillGroup e) {
		e.setName(Texts.clean(name));
		e.setIcon(Texts.clean(icon));
		e.setItems(Texts.cleanList(items));
	}
}
