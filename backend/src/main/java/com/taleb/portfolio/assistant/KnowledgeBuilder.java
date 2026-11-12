package com.taleb.portfolio.assistant;

import java.util.ArrayList;
import java.util.List;
import java.util.StringJoiner;

import org.springframework.stereotype.Component;

import com.taleb.portfolio.common.SectionService;
import com.taleb.portfolio.content.certification.Certification;
import com.taleb.portfolio.content.certification.CertificationDto;
import com.taleb.portfolio.content.education.Education;
import com.taleb.portfolio.content.education.EducationDto;
import com.taleb.portfolio.content.experience.Experience;
import com.taleb.portfolio.content.experience.ExperienceDto;
import com.taleb.portfolio.content.knowledge.KnowledgeEntry;
import com.taleb.portfolio.content.knowledge.KnowledgeEntryDto;
import com.taleb.portfolio.content.language.SpokenLanguage;
import com.taleb.portfolio.content.language.SpokenLanguageDto;
import com.taleb.portfolio.content.profile.ProfileDto;
import com.taleb.portfolio.content.profile.ProfileService;
import com.taleb.portfolio.content.project.Project;
import com.taleb.portfolio.content.project.ProjectDto;
import com.taleb.portfolio.content.skill.SkillGroup;
import com.taleb.portfolio.content.skill.SkillGroupDto;

/**
 * Transforme le contenu visible de la vitrine en fiches autonomes pour le RAG :
 * une fiche par élément (projet, expérience…), chacune compréhensible seule.
 */
@Component
class KnowledgeBuilder {

	static final String PROFILE_ID = "profile";

	private final ProfileService profileService;
	private final SectionService<SkillGroup, SkillGroupDto> skills;
	private final SectionService<Experience, ExperienceDto> experiences;
	private final SectionService<Project, ProjectDto> projects;
	private final SectionService<Education, EducationDto> education;
	private final SectionService<Certification, CertificationDto> certifications;
	private final SectionService<SpokenLanguage, SpokenLanguageDto> languages;
	private final SectionService<KnowledgeEntry, KnowledgeEntryDto> knowledge;

	KnowledgeBuilder(ProfileService profileService, SectionService<SkillGroup, SkillGroupDto> skills,
			SectionService<Experience, ExperienceDto> experiences, SectionService<Project, ProjectDto> projects,
			SectionService<Education, EducationDto> education,
			SectionService<Certification, CertificationDto> certifications,
			SectionService<SpokenLanguage, SpokenLanguageDto> languages,
			SectionService<KnowledgeEntry, KnowledgeEntryDto> knowledge) {
		this.profileService = profileService;
		this.skills = skills;
		this.experiences = experiences;
		this.projects = projects;
		this.education = education;
		this.certifications = certifications;
		this.languages = languages;
		this.knowledge = knowledge;
	}

	ProfileDto profile() {
		return profileService.get();
	}

	List<KnowledgeChunk> build() {
		List<KnowledgeChunk> chunks = new ArrayList<>();
		ProfileDto p = profileService.get();
		chunks.add(new KnowledgeChunk(PROFILE_ID, "Profil", "Profil — " + p.fullName(), lines(
				"Nom : " + p.fullName(),
				"Titre : " + p.headline(),
				p.tagline(),
				p.summary(),
				label("Localisation", p.location()),
				label("Disponibilité", p.availability()),
				label("E-mail", p.email()),
				label("LinkedIn", p.linkedinUrl()),
				label("GitHub", p.githubUrl()),
				label("Qualités", String.join(", ", p.qualities())),
				label("Divers", String.join(" ; ", p.extras()))), "#about"));

		for (SkillGroupDto s : skills.findVisible()) {
			chunks.add(new KnowledgeChunk("skills:" + s.id(), "Compétences", "Compétences — " + s.name(),
					"Compétences en " + s.name() + " : " + String.join(", ", s.items()) + ".", "#skills"));
		}
		for (ExperienceDto e : experiences.findVisible()) {
			chunks.add(new KnowledgeChunk("experience:" + e.id(), "Expérience",
					"Expérience — " + e.role() + " · " + e.company(), lines(
							e.role() + " chez " + e.company() + suffix(" (", e.kind(), ")"),
							label("Période", e.period()),
							label("Lieu", e.location()),
							e.summary(),
							bullets(e.highlights()),
							label("Technologies", String.join(", ", e.stack()))), "#experience"));
		}
		for (ProjectDto pr : projects.findVisible()) {
			chunks.add(new KnowledgeChunk("project:" + pr.slug(), "Projet", "Projet — " + pr.title(), lines(
					"Projet " + pr.title() + suffix(" : ", pr.tagline(), ""),
					label("Contexte", pr.context()),
					label("Période", pr.period()),
					label("Statut", pr.status() == Project.Status.IN_PROGRESS ? "en cours" : "terminé"),
					pr.summary(),
					pr.description(),
					label("Son rôle", pr.role()),
					bullets(pr.highlights()),
					label("Technologies", String.join(", ", pr.stack())),
					pr.architecture().isEmpty() ? null : "Architecture :\n" + bullets(pr.architecture()),
					label("Code source", pr.repoUrl()),
					label("Démo", pr.demoUrl()),
					Boolean.TRUE.equals(pr.confidential())
							? "Projet confidentiel : le code n'est pas public. " + nullToEmpty(pr.confidentialNote())
							: null), "/projects/" + pr.slug()));
		}
		for (EducationDto ed : education.findVisible()) {
			chunks.add(new KnowledgeChunk("education:" + ed.id(), "Formation", "Formation — " + ed.degree(), lines(
					ed.degree() + suffix(" — ", ed.field(), ""),
					label("Établissement", ed.school() + suffix(", ", ed.location(), "")),
					label("Période", ed.period()),
					label("Mention", ed.mention()),
					ed.description()), "#education"));
		}
		List<CertificationDto> certs = certifications.findVisible();
		if (!certs.isEmpty()) {
			StringJoiner joiner = new StringJoiner("\n", "Certifications :\n", "");
			certs.forEach(c -> joiner.add("- " + c.name() + " (" + c.issuer() + suffix(", ", c.issuedOn(), "") + ")"));
			chunks.add(new KnowledgeChunk("certifications", "Certifications", "Certifications", joiner.toString(),
					"#education"));
		}
		List<SpokenLanguageDto> langs = languages.findVisible();
		if (!langs.isEmpty()) {
			StringJoiner joiner = new StringJoiner(", ", "Langues parlées : ", ".");
			langs.forEach(l -> joiner.add(l.name() + " (" + l.level() + ")"));
			chunks.add(new KnowledgeChunk("languages", "Langues", "Langues", joiner.toString(), "#education"));
		}
		for (KnowledgeEntryDto k : knowledge.findVisible()) {
			chunks.add(new KnowledgeChunk("knowledge:" + k.id(), "Informations", k.title(), k.content(), null));
		}
		return chunks;
	}

	private static String lines(String... parts) {
		StringJoiner joiner = new StringJoiner("\n");
		for (String part : parts) {
			if (part != null && !part.isBlank()) {
				joiner.add(part.strip());
			}
		}
		return joiner.toString();
	}

	private static String label(String label, String value) {
		return value == null || value.isBlank() ? null : label + " : " + value;
	}

	private static String bullets(List<String> items) {
		if (items == null || items.isEmpty()) {
			return null;
		}
		StringJoiner joiner = new StringJoiner("\n");
		items.forEach(item -> joiner.add("- " + item));
		return joiner.toString();
	}

	private static String suffix(String before, String value, String after) {
		return value == null || value.isBlank() ? "" : before + value + after;
	}

	private static String nullToEmpty(String value) {
		return value == null ? "" : value;
	}
}
