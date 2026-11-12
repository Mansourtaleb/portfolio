package com.taleb.portfolio.content.settings;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.taleb.portfolio.common.Timestamped;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Réglages de la vitrine : ordre et visibilité des sections, thème, assistant IA (ligne unique, id = 1). */
@Entity
@Table(name = "site_settings")
public class SiteSettings extends Timestamped {

	public static final long SINGLETON_ID = 1L;

	/** Sections de la page d'accueil que l'admin peut réordonner ou masquer. */
	public static final List<String> SECTION_KEYS = List.of("about", "skills", "experience", "projects", "education",
			"contact");

	@Id
	private Long id = SINGLETON_ID;

	@Column(name = "site_title", nullable = false, length = 160)
	private String siteTitle;

	@Column(name = "meta_description", length = 300)
	private String metaDescription;

	@Column(name = "default_theme", nullable = false, length = 10)
	private String defaultTheme = "dark";

	@JdbcTypeCode(SqlTypes.ARRAY)
	@Column(name = "section_order", nullable = false, columnDefinition = "text[]")
	private List<String> sectionOrder = new ArrayList<>();

	@JdbcTypeCode(SqlTypes.ARRAY)
	@Column(name = "hidden_sections", nullable = false, columnDefinition = "text[]")
	private List<String> hiddenSections = new ArrayList<>();

	@Column(name = "assistant_enabled", nullable = false)
	private boolean assistantEnabled = true;

	@Column(name = "assistant_greeting", length = 500)
	private String assistantGreeting;

	@JdbcTypeCode(SqlTypes.ARRAY)
	@Column(name = "assistant_suggestions", nullable = false, columnDefinition = "text[]")
	private List<String> assistantSuggestions = new ArrayList<>();

	@Column(name = "contact_form_enabled", nullable = false)
	private boolean contactFormEnabled = true;

	public Long getId() {
		return id;
	}

	public String getSiteTitle() {
		return siteTitle;
	}

	public void setSiteTitle(String siteTitle) {
		this.siteTitle = siteTitle;
	}

	public String getMetaDescription() {
		return metaDescription;
	}

	public void setMetaDescription(String metaDescription) {
		this.metaDescription = metaDescription;
	}

	public String getDefaultTheme() {
		return defaultTheme;
	}

	public void setDefaultTheme(String defaultTheme) {
		this.defaultTheme = defaultTheme;
	}

	public List<String> getSectionOrder() {
		return sectionOrder;
	}

	public void setSectionOrder(List<String> sectionOrder) {
		this.sectionOrder = sectionOrder;
	}

	public List<String> getHiddenSections() {
		return hiddenSections;
	}

	public void setHiddenSections(List<String> hiddenSections) {
		this.hiddenSections = hiddenSections;
	}

	public boolean isAssistantEnabled() {
		return assistantEnabled;
	}

	public void setAssistantEnabled(boolean assistantEnabled) {
		this.assistantEnabled = assistantEnabled;
	}

	public String getAssistantGreeting() {
		return assistantGreeting;
	}

	public void setAssistantGreeting(String assistantGreeting) {
		this.assistantGreeting = assistantGreeting;
	}

	public List<String> getAssistantSuggestions() {
		return assistantSuggestions;
	}

	public void setAssistantSuggestions(List<String> assistantSuggestions) {
		this.assistantSuggestions = assistantSuggestions;
	}

	public boolean isContactFormEnabled() {
		return contactFormEnabled;
	}

	public void setContactFormEnabled(boolean contactFormEnabled) {
		this.contactFormEnabled = contactFormEnabled;
	}
}
