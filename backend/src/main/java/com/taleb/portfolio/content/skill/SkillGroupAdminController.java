package com.taleb.portfolio.content.skill;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.SectionAdminController;
import com.taleb.portfolio.common.SectionService;

@RestController
@RequestMapping("/api/admin/skills")
class SkillGroupAdminController extends SectionAdminController<SkillGroup, SkillGroupDto> {

	SkillGroupAdminController(SectionService<SkillGroup, SkillGroupDto> service) {
		super(service);
	}
}
