package com.taleb.portfolio.content.project;

import java.util.List;

import com.taleb.portfolio.common.SectionDto;
import com.taleb.portfolio.common.Texts;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProjectDto(
		Long id,
		@NotBlank(message = "Le slug est obligatoire") @Size(max = 80)
		@Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*", message = "Minuscules, chiffres et tirets uniquement (ex. mon-projet)") String slug,
		@NotBlank(message = "Le titre est obligatoire") @Size(max = 120) String title,
		@Size(max = 300) String tagline,
		@Size(max = 200) String context,
		@Size(max = 80) String period,
		@NotNull(message = "Le statut est obligatoire") Project.Status status,
		@Size(max = 4000) String summary,
		@Size(max = 10000) String description,
		@Size(max = 4000) String role,
		List<@Size(max = 600) String> highlights,
		List<@Size(max = 80) String> stack,
		@Size(max = 12) List<@Size(max = 300) String> architecture,
		@Size(max = 300) @Pattern(regexp = "^(https?://.*)?$", message = "URL http(s) attendue") String repoUrl,
		@Size(max = 300) @Pattern(regexp = "^(https?://.*)?$", message = "URL http(s) attendue") String demoUrl,
		Boolean confidential,
		@Size(max = 300) String confidentialNote,
		Boolean featured,
		Integer sortOrder,
		Boolean visible,
		/** Galerie (lecture seule : gérée par les endpoints /images). */
		List<ProjectImageService.ImageRef> images) implements SectionDto<Project> {

	public static ProjectDto from(Project e) {
		return from(e, List.of());
	}

	public static ProjectDto from(Project e, List<ProjectImageService.ImageRef> images) {
		return new ProjectDto(e.getId(), e.getSlug(), e.getTitle(), e.getTagline(), e.getContext(), e.getPeriod(),
				e.getStatus(), e.getSummary(), e.getDescription(), e.getRole(), List.copyOf(e.getHighlights()),
				List.copyOf(e.getStack()), List.copyOf(e.getArchitecture()), e.getRepoUrl(), e.getDemoUrl(), e.isConfidential(), e.getConfidentialNote(),
				e.isFeatured(), e.getSortOrder(), e.isVisible(), images);
	}

	@Override
	public void applyTo(Project e) {
		boolean isConfidential = Texts.orDefault(confidential, false);
		e.setSlug(Texts.clean(slug));
		e.setTitle(Texts.clean(title));
		e.setTagline(Texts.clean(tagline));
		e.setContext(Texts.clean(context));
		e.setPeriod(Texts.clean(period));
		e.setStatus(status);
		e.setSummary(Texts.clean(summary));
		e.setDescription(Texts.clean(description));
		e.setRole(Texts.clean(role));
		e.setHighlights(Texts.cleanList(highlights));
		e.setStack(Texts.cleanList(stack));
		e.setArchitecture(Texts.cleanList(architecture));
		// Un projet confidentiel n'expose jamais de lien vers son code.
		e.setRepoUrl(isConfidential ? null : Texts.clean(repoUrl));
		e.setDemoUrl(Texts.clean(demoUrl));
		e.setConfidential(isConfidential);
		e.setConfidentialNote(Texts.clean(confidentialNote));
		e.setFeatured(Texts.orDefault(featured, false));
	}
}
