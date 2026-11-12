package com.taleb.portfolio.content;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.taleb.portfolio.common.SectionService;
import com.taleb.portfolio.content.certification.Certification;
import com.taleb.portfolio.content.certification.CertificationDto;
import com.taleb.portfolio.content.certification.CertificationRepository;
import com.taleb.portfolio.content.education.Education;
import com.taleb.portfolio.content.education.EducationDto;
import com.taleb.portfolio.content.education.EducationRepository;
import com.taleb.portfolio.content.experience.Experience;
import com.taleb.portfolio.content.experience.ExperienceDto;
import com.taleb.portfolio.content.experience.ExperienceRepository;
import com.taleb.portfolio.content.knowledge.KnowledgeEntry;
import com.taleb.portfolio.content.knowledge.KnowledgeEntryDto;
import com.taleb.portfolio.content.knowledge.KnowledgeEntryRepository;
import com.taleb.portfolio.content.language.SpokenLanguage;
import com.taleb.portfolio.content.language.SpokenLanguageDto;
import com.taleb.portfolio.content.language.SpokenLanguageRepository;
import com.taleb.portfolio.content.project.Project;
import com.taleb.portfolio.content.project.ProjectDto;
import com.taleb.portfolio.content.project.ProjectRepository;
import com.taleb.portfolio.content.skill.SkillGroup;
import com.taleb.portfolio.content.skill.SkillGroupDto;
import com.taleb.portfolio.content.skill.SkillGroupRepository;

/** Un service CRUD générique par section « liste » de la vitrine. */
@Configuration(proxyBeanMethods = false)
class ContentConfig {

	@Bean
	SectionService<SkillGroup, SkillGroupDto> skillService(SkillGroupRepository repo, ApplicationEventPublisher events) {
		return new SectionService<>("skills", repo, SkillGroup::new, SkillGroupDto::from, events);
	}

	@Bean
	SectionService<Experience, ExperienceDto> experienceService(ExperienceRepository repo,
			ApplicationEventPublisher events) {
		return new SectionService<>("experiences", repo, Experience::new, ExperienceDto::from, events);
	}

	@Bean
	SectionService<Project, ProjectDto> projectService(ProjectRepository repo, ApplicationEventPublisher events) {
		return new SectionService<>("projects", repo, Project::new, ProjectDto::from, events);
	}

	@Bean
	SectionService<Education, EducationDto> educationService(EducationRepository repo,
			ApplicationEventPublisher events) {
		return new SectionService<>("education", repo, Education::new, EducationDto::from, events);
	}

	@Bean
	SectionService<Certification, CertificationDto> certificationService(CertificationRepository repo,
			ApplicationEventPublisher events) {
		return new SectionService<>("certifications", repo, Certification::new, CertificationDto::from, events);
	}

	@Bean
	SectionService<SpokenLanguage, SpokenLanguageDto> languageService(SpokenLanguageRepository repo,
			ApplicationEventPublisher events) {
		return new SectionService<>("languages", repo, SpokenLanguage::new, SpokenLanguageDto::from, events);
	}

	@Bean
	SectionService<KnowledgeEntry, KnowledgeEntryDto> knowledgeService(KnowledgeEntryRepository repo,
			ApplicationEventPublisher events) {
		return new SectionService<>("knowledge", repo, KnowledgeEntry::new, KnowledgeEntryDto::from, events);
	}
}
