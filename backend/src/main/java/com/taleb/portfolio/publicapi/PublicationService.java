package com.taleb.portfolio.publicapi;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taleb.portfolio.assistant.AssistantService;
import com.taleb.portfolio.common.PublishedEvent;
import com.taleb.portfolio.common.SectionService;
import com.taleb.portfolio.content.avatar.AvatarService;
import com.taleb.portfolio.content.certification.Certification;
import com.taleb.portfolio.content.certification.CertificationDto;
import com.taleb.portfolio.content.cv.CvService;
import com.taleb.portfolio.content.education.Education;
import com.taleb.portfolio.content.education.EducationDto;
import com.taleb.portfolio.content.experience.Experience;
import com.taleb.portfolio.content.experience.ExperienceDto;
import com.taleb.portfolio.content.language.SpokenLanguage;
import com.taleb.portfolio.content.language.SpokenLanguageDto;
import com.taleb.portfolio.content.profile.ProfileService;
import com.taleb.portfolio.content.project.Project;
import com.taleb.portfolio.content.project.ProjectDto;
import com.taleb.portfolio.content.settings.SiteSettingsService;
import com.taleb.portfolio.content.skill.SkillGroup;
import com.taleb.portfolio.content.skill.SkillGroupDto;
import com.taleb.portfolio.content.testimonial.Testimonial;
import com.taleb.portfolio.content.testimonial.TestimonialDto;
import com.taleb.portfolio.i18n.TranslationService;
import com.taleb.portfolio.publicapi.PublicController.PortfolioView;
import com.taleb.portfolio.publicapi.PublicController.PublicProfile;
import com.taleb.portfolio.publicapi.PublicController.PublicSettings;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

/**
 * Brouillon / publication. L'admin modifie le contenu (brouillon) ; les visiteurs voient le dernier
 * instantané publié, construit en français et en anglais (traductions appliquées, repli sur le français).
 * Les fichiers (photo, CV, captures) restent immédiats.
 */
@Service
public class PublicationService {

	public static final List<String> LANGS = List.of("fr", "en");
	/** Tableaux de la vue → type de contenu des traductions. */
	private static final Map<String, String> SECTION_ENTITIES = Map.of("skills", "skills", "experiences", "experiences",
			"projects", "projects", "education", "education", "certifications", "certifications", "languages",
			"languages", "testimonials", "testimonials");

	private static final Logger log = LoggerFactory.getLogger(PublicationService.class);

	private final ProfileService profileService;
	private final SiteSettingsService settingsService;
	private final SectionService<SkillGroup, SkillGroupDto> skills;
	private final SectionService<Experience, ExperienceDto> experiences;
	private final SectionService<Project, ProjectDto> projects;
	private final SectionService<Education, EducationDto> education;
	private final SectionService<Certification, CertificationDto> certifications;
	private final SectionService<SpokenLanguage, SpokenLanguageDto> languages;
	private final SectionService<Testimonial, TestimonialDto> testimonials;
	private final TranslationService translations;
	private final AssistantService assistant;
	private final CvService cvService;
	private final AvatarService avatarService;
	private final JdbcClient jdbc;
	private final JsonMapper mapper;
	private final ApplicationEventPublisher events;
	private final Map<String, JsonNode> cache = new ConcurrentHashMap<>();

	PublicationService(ProfileService profileService, SiteSettingsService settingsService,
			SectionService<SkillGroup, SkillGroupDto> skills, SectionService<Experience, ExperienceDto> experiences,
			SectionService<Project, ProjectDto> projects, SectionService<Education, EducationDto> education,
			SectionService<Certification, CertificationDto> certifications,
			SectionService<SpokenLanguage, SpokenLanguageDto> languages,
			SectionService<Testimonial, TestimonialDto> testimonials, TranslationService translations,
			AssistantService assistant, CvService cvService, AvatarService avatarService, JdbcClient jdbc,
			JsonMapper mapper, ApplicationEventPublisher events) {
		this.profileService = profileService;
		this.settingsService = settingsService;
		this.skills = skills;
		this.experiences = experiences;
		this.projects = projects;
		this.education = education;
		this.certifications = certifications;
		this.languages = languages;
		this.testimonials = testimonials;
		this.translations = translations;
		this.assistant = assistant;
		this.cvService = cvService;
		this.avatarService = avatarService;
		this.jdbc = jdbc;
		this.mapper = mapper;
		this.events = events;
	}

	/** Premier démarrage : publie le contenu initial pour que la vitrine soit en ligne tout de suite. */
	@EventListener(ApplicationReadyEvent.class)
	@Order(0)
	void publishInitialVersion() {
		long count = jdbc.sql("select count(*) from published_snapshot").query(Long.class).single();
		if (count < LANGS.size()) {
			publish();
			log.info("Première publication de la vitrine effectuée.");
		}
	}

	/** Vue publiée (visiteurs). */
	public JsonNode published(String lang) {
		JsonNode node = cache.computeIfAbsent(normalize(lang), l -> jdbc
				.sql("select content::text from published_snapshot where lang = :l").param("l", l)
				.query(String.class).optional().map(mapper::readTree).orElse(null));
		return withLiveParts(node != null ? node.deepCopy() : build(normalize(lang)));
	}

	/** Vue du brouillon (aperçu admin, avant publication). */
	@Transactional(readOnly = true)
	public JsonNode preview(String lang) {
		return withLiveParts(build(normalize(lang)));
	}

	public Optional<JsonNode> publishedProject(String slug, String lang) {
		return findProject(published(lang), slug);
	}

	@Transactional(readOnly = true)
	public Optional<JsonNode> previewProject(String slug, String lang) {
		return findProject(preview(lang), slug);
	}

	/** Met en ligne le brouillon actuel (FR + EN) puis réindexe l'assistant. */
	@Transactional
	public Status publish() {
		for (String lang : LANGS) {
			String json = mapper.writeValueAsString(build(lang));
			jdbc.sql("""
					insert into published_snapshot (lang, content, content_hash, published_at)
					values (:l, cast(:c as jsonb), :h, now())
					on conflict (lang) do update set content = excluded.content, content_hash = excluded.content_hash,
					  published_at = excluded.published_at""")
					.param("l", lang).param("c", json).param("h", sha256(json)).update();
			cache.remove(lang);
		}
		events.publishEvent(new PublishedEvent());
		return status();
	}

	/** Y a-t-il des modifications non publiées ? (comparaison des empreintes brouillon / publié) */
	@Transactional(readOnly = true)
	public Status status() {
		Instant publishedAt = null;
		boolean upToDate = true;
		for (String lang : LANGS) {
			var row = jdbc.sql("select content_hash, published_at from published_snapshot where lang = :l").param("l", lang)
					.query((rs, i) -> new Object[] { rs.getString(1), rs.getTimestamp(2).toInstant() }).optional();
			if (row.isEmpty()) {
				upToDate = false;
				continue;
			}
			publishedAt = (Instant) row.get()[1];
			upToDate &= row.get()[0].equals(sha256(mapper.writeValueAsString(build(lang))));
		}
		return new Status(publishedAt, !upToDate);
	}

	/** Construit la vue complète à partir du contenu actuel, traductions appliquées pour l'anglais. */
	JsonNode build(String lang) {
		PortfolioView view = new PortfolioView(
				PublicProfile.from(profileService.get(), null, null),
				PublicSettings.from(settingsService.get(), true),
				skills.findVisible(), experiences.findVisible(), projects.findVisible(), education.findVisible(),
				certifications.findVisible(), languages.findVisible());
		ObjectNode node = mapper.valueToTree(view);
		node.put("lang", lang);
		node.set("testimonials", mapper.valueToTree(testimonials.findVisible()));
		if (!"fr".equals(lang)) {
			apply((ObjectNode) node.get("profile"), translations.get("profile", 1L));
			apply((ObjectNode) node.get("settings"), translations.get("settings", 1L));
			SECTION_ENTITIES.forEach((array, entity) -> {
				Map<Long, Map<String, Object>> all = translations.all(entity);
				for (JsonNode item : node.withArray(array)) {
					Map<String, Object> values = all.get(item.get("id").asLong());
					if (values != null) {
						apply((ObjectNode) item, values);
					}
				}
			});
		}
		return node;
	}

	/** Les fichiers et l'état de l'assistant ne font pas partie de l'instantané : toujours la valeur actuelle. */
	private JsonNode withLiveParts(JsonNode node) {
		ObjectNode profile = (ObjectNode) node.get("profile");
		String cvUrl = cvService.exists() ? CvService.PUBLIC_URL : null;
		if (cvUrl != null) {
			profile.put("cvUrl", cvUrl);
		}
		avatarService.publicUrl().ifPresent(url -> profile.put("avatarUrl", url));
		ObjectNode settings = (ObjectNode) node.get("settings");
		settings.put("assistantEnabled", settings.get("assistantEnabled").asBoolean() && assistant.isAvailable());
		return node;
	}

	private static void apply(ObjectNode target, Map<String, Object> values) {
		values.forEach((field, value) -> {
			if (value instanceof List<?> list) {
				ArrayNode array = target.putArray(field);
				list.forEach(v -> array.add(String.valueOf(v)));
			}
			else if (value != null) {
				target.put(field, String.valueOf(value));
			}
		});
	}

	private static Optional<JsonNode> findProject(JsonNode view, String slug) {
		for (JsonNode p : view.withArray("projects")) {
			if (slug.equals(p.get("slug").asString())) {
				return Optional.of(p);
			}
		}
		return Optional.empty();
	}

	static String normalize(String lang) {
		return lang != null && LANGS.contains(lang) ? lang : "fr";
	}

	private static String sha256(String text) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8)));
		}
		catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(e);
		}
	}

	public record Status(Instant publishedAt, boolean pendingChanges) {
	}
}
