package com.taleb.portfolio.content.skill;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.SectionAdminController;
import com.taleb.portfolio.common.SectionService;

@Tag(name = "Admin · Compétences", description = "CRUD des groupes de compétences")
@RestController
@RequestMapping("/api/admin/skills")
class SkillGroupAdminController extends SectionAdminController<SkillGroup, SkillGroupDto> {

	SkillGroupAdminController(SectionService<SkillGroup, SkillGroupDto> service) {
		super(service);
	}
}
