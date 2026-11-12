package com.taleb.portfolio.content.project;

import java.util.Optional;

import com.taleb.portfolio.common.SectionRepository;

public interface ProjectRepository extends SectionRepository<Project> {

	Optional<Project> findBySlugAndVisibleTrue(String slug);
}
