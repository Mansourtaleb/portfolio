package com.taleb.portfolio.content.experience;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.SectionAdminController;
import com.taleb.portfolio.common.SectionService;

@Tag(name = "Admin · Expériences", description = "CRUD des expériences")
@RestController
@RequestMapping("/api/admin/experiences")
class ExperienceAdminController extends SectionAdminController<Experience, ExperienceDto> {

	ExperienceAdminController(SectionService<Experience, ExperienceDto> service) {
		super(service);
	}
}
