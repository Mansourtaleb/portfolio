package com.taleb.portfolio.content.project;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.SectionAdminController;
import com.taleb.portfolio.common.SectionService;

@Tag(name = "Admin · Projets", description = "CRUD des projets")
@RestController
@RequestMapping("/api/admin/projects")
class ProjectAdminController extends SectionAdminController<Project, ProjectDto> {

	ProjectAdminController(SectionService<Project, ProjectDto> service) {
		super(service);
	}
}
