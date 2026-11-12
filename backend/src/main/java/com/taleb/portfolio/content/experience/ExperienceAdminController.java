package com.taleb.portfolio.content.experience;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.SectionAdminController;
import com.taleb.portfolio.common.SectionService;

@RestController
@RequestMapping("/api/admin/experiences")
class ExperienceAdminController extends SectionAdminController<Experience, ExperienceDto> {

	ExperienceAdminController(SectionService<Experience, ExperienceDto> service) {
		super(service);
	}
}
