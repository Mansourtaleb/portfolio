package com.taleb.portfolio.publicapi;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.taleb.portfolio.analytics.AnalyticsService;
import com.taleb.portfolio.analytics.AnalyticsService.EventType;
import com.taleb.portfolio.assistant.AssistantService;
import com.taleb.portfolio.common.ClientIp;
import com.taleb.portfolio.common.NotFoundException;
import com.taleb.portfolio.common.RateLimiter;
import com.taleb.portfolio.common.SectionService;
import com.taleb.portfolio.contact.ContactService;
import com.taleb.portfolio.contact.ContactService.ContactRequest;
import com.taleb.portfolio.content.certification.Certification;
import com.taleb.portfolio.content.certification.CertificationDto;
import com.taleb.portfolio.content.avatar.AvatarService;
import com.taleb.portfolio.content.cv.CvService;
import com.taleb.portfolio.content.education.Education;
import com.taleb.portfolio.content.education.EducationDto;
import com.taleb.portfolio.content.experience.Experience;
import com.taleb.portfolio.content.experience.ExperienceDto;
import com.taleb.portfolio.content.language.SpokenLanguage;
import com.taleb.portfolio.content.language.SpokenLanguageDto;
import com.taleb.portfolio.content.profile.ProfileDto;
import com.taleb.portfolio.content.profile.ProfileService;
import com.taleb.portfolio.content.project.Project;
import com.taleb.portfolio.content.project.ProjectDto;
import com.taleb.portfolio.content.project.ProjectImageService;
import com.taleb.portfolio.content.project.ProjectRepository;
import com.taleb.portfolio.content.settings.SiteSettingsDto;
import com.taleb.portfolio.content.settings.SiteSettingsService;
import com.taleb.portfolio.content.skill.SkillGroup;
import com.taleb.portfolio.content.skill.SkillGroupDto;

import jakarta.servlet.http.HttpServletRequest;
import tools.jackson.databind.JsonNode;
import jakarta.validation.Valid;

/** API publique de la vitrine : lecture seule, uniquement le contenu marqué visible. */
@Tag(name = "Vitrine", description = "Contenu public de la vitrine et formulaire de contact")
@RestController
@RequestMapping("/api/public")
class PublicController {

	private final ProfileService profileService;
	private final SiteSettingsService settingsService;
	private final SectionService<SkillGroup, SkillGroupDto> skills;
	private final SectionService<Experience, ExperienceDto> experiences;
	private final SectionService<Project, ProjectDto> projects;
	private final SectionService<Education, EducationDto> education;
	private final SectionService<Certification, CertificationDto> certifications;
	private final SectionService<SpokenLanguage, SpokenLanguageDto> languages;
	private final ProjectRepository projectRepository;
	private final ContactService contactService;
	private final AssistantService assistantService;
	private final CvService cvService;
	private final AvatarService avatarService;
	private final ProjectImageService imageService;
	private final AnalyticsService analytics;
	private final PublicationService publication;
	private final RateLimiter contactLimiter = new RateLimiter(3, Duration.ofMinutes(10));

	PublicController(ProfileService profileService, SiteSettingsService settingsService,
			SectionService<SkillGroup, SkillGroupDto> skills, SectionService<Experience, ExperienceDto> experiences,
			SectionService<Project, ProjectDto> projects, SectionService<Education, EducationDto> education,
			SectionService<Certification, CertificationDto> certifications,
			SectionService<SpokenLanguage, SpokenLanguageDto> languages, ProjectRepository projectRepository,
			ContactService contactService, AssistantService assistantService, CvService cvService,
			AvatarService avatarService, ProjectImageService imageService, AnalyticsService analytics,
			PublicationService publication) {
		this.publication = publication;
		this.analytics = analytics;
		this.imageService = imageService;
		this.cvService = cvService;
		this.avatarService = avatarService;
		this.profileService = profileService;
		this.settingsService = settingsService;
		this.skills = skills;
		this.experiences = experiences;
		this.projects = projects;
		this.education = education;
		this.certifications = certifications;
		this.languages = languages;
		this.projectRepository = projectRepository;
		this.contactService = contactService;
		this.assistantService = assistantService;
	}

	/** Vitrine publiée, en français (par défaut) ou en anglais (?lang=en). */
	@GetMapping("/portfolio")
	ResponseEntity<JsonNode> portfolio(@RequestParam(defaultValue = "fr") String lang) {
		return ResponseEntity.ok().cacheControl(CacheControl.noCache()).body(publication.published(lang));
	}

	@GetMapping("/projects/{slug}")
	JsonNode project(@PathVariable String slug, @RequestParam(defaultValue = "fr") String lang) {
		return publication.publishedProject(slug, lang).orElseThrow(() -> new NotFoundException("Projet introuvable"));
	}

	@PostMapping("/contact")
	@ResponseStatus(HttpStatus.ACCEPTED)
	void contact(@Valid @RequestBody ContactRequest request, HttpServletRequest http) {
		if (!settingsService.get().contactFormEnabled()) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND);
		}
		contactLimiter.check(ClientIp.of(http), "Trop de messages envoyés. Réessayez plus tard.");
		if (request.website() != null && !request.website().isBlank()) {
			return; // robot : on fait comme si tout allait bien, sans rien enregistrer
		}
		contactService.submit(request);
		analytics.record(EventType.CONTACT_MESSAGE, http, null, null, null);
	}

	record PortfolioView(PublicProfile profile, PublicSettings settings, List<SkillGroupDto> skills,
			List<ExperienceDto> experiences, List<ProjectDto> projects, List<EducationDto> education,
			List<CertificationDto> certifications, List<SpokenLanguageDto> languages) {
	}

	/** Profil public : le téléphone n'est exposé que si l'admin l'a choisi. */
	record PublicProfile(String fullName, String headline, String tagline, String summary, String location,
			String email, String phone, String linkedinUrl, String githubUrl, String cvUrl, String avatarUrl,
			String availability, List<String> qualities, List<String> extras) {

		/** Le CV téléversé dans l'admin est prioritaire sur un lien saisi à la main. */
		static PublicProfile from(ProfileDto p, String uploadedCvUrl, String uploadedAvatarUrl) {
			return new PublicProfile(p.fullName(), p.headline(), p.tagline(), p.summary(), p.location(), p.email(),
					Boolean.TRUE.equals(p.showPhone()) ? p.phone() : null, p.linkedinUrl(), p.githubUrl(),
					uploadedCvUrl != null ? uploadedCvUrl : p.cvUrl(),
					uploadedAvatarUrl != null ? uploadedAvatarUrl : p.avatarUrl(), p.availability(), p.qualities(), p.extras());
		}
	}

	record PublicSettings(String siteTitle, String metaDescription, String defaultTheme, List<String> sections,
			boolean assistantEnabled, String assistantGreeting, List<String> assistantSuggestions,
			boolean contactFormEnabled) {

		static PublicSettings from(SiteSettingsDto s, boolean assistantAvailable) {
			List<String> sections = s.sectionOrder().stream().filter(key -> !s.hiddenSections().contains(key))
					.toList();
			return new PublicSettings(s.siteTitle(), s.metaDescription(), s.defaultTheme(), sections,
					Boolean.TRUE.equals(s.assistantEnabled()) && assistantAvailable, s.assistantGreeting(),
					s.assistantSuggestions(), Boolean.TRUE.equals(s.contactFormEnabled()));
		}
	}
}
