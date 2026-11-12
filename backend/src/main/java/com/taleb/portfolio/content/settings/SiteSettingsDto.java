package com.taleb.portfolio.content.settings;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import com.taleb.portfolio.common.Texts;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SiteSettingsDto(
		@NotBlank(message = "Le titre du site est obligatoire") @Size(max = 160) String siteTitle,
		@Size(max = 300) String metaDescription,
		@Pattern(regexp = "dark|light", message = "Thème : dark ou light") String defaultTheme,
		List<String> sectionOrder,
		List<String> hiddenSections,
		Boolean assistantEnabled,
		@Size(max = 500) String assistantGreeting,
		@Size(max = 6) List<@Size(max = 120) String> assistantSuggestions,
		Boolean contactFormEnabled,
		List<String> availableSections) {

	public static SiteSettingsDto from(SiteSettings s) {
		return new SiteSettingsDto(s.getSiteTitle(), s.getMetaDescription(), s.getDefaultTheme(),
				normalizedOrder(s.getSectionOrder()), List.copyOf(s.getHiddenSections()), s.isAssistantEnabled(),
				s.getAssistantGreeting(), List.copyOf(s.getAssistantSuggestions()), s.isContactFormEnabled(),
				SiteSettings.SECTION_KEYS);
	}

	public void applyTo(SiteSettings s) {
		s.setSiteTitle(Texts.clean(siteTitle));
		s.setMetaDescription(Texts.clean(metaDescription));
		s.setDefaultTheme(defaultTheme == null ? "dark" : defaultTheme);
		s.setSectionOrder(normalizedOrder(sectionOrder));
		s.setHiddenSections(Texts.cleanList(hiddenSections).stream().filter(SiteSettings.SECTION_KEYS::contains)
				.distinct().toList());
		s.setAssistantEnabled(Texts.orDefault(assistantEnabled, true));
		s.setAssistantGreeting(Texts.clean(assistantGreeting));
		s.setAssistantSuggestions(Texts.cleanList(assistantSuggestions));
		s.setContactFormEnabled(Texts.orDefault(contactFormEnabled, true));
	}

	/** Garde les sections connues, sans doublon, et ajoute à la fin celles qui manquent. */
	static List<String> normalizedOrder(List<String> order) {
		Set<String> result = new LinkedHashSet<>();
		for (String key : Texts.cleanList(order)) {
			if (SiteSettings.SECTION_KEYS.contains(key)) {
				result.add(key);
			}
		}
		result.addAll(SiteSettings.SECTION_KEYS);
		return new ArrayList<>(result);
	}
}
