package com.taleb.portfolio.content.education;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.SectionAdminController;
import com.taleb.portfolio.common.SectionService;

@Tag(name = "Admin · Formation", description = "CRUD des formations")
@RestController
@RequestMapping("/api/admin/education")
class EducationAdminController extends SectionAdminController<Education, EducationDto> {

	EducationAdminController(SectionService<Education, EducationDto> service) {
		super(service);
	}
}
