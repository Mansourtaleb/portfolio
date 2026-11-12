package com.taleb.portfolio.content.language;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.SectionAdminController;
import com.taleb.portfolio.common.SectionService;

@Tag(name = "Admin · Langues", description = "CRUD des langues")
@RestController
@RequestMapping("/api/admin/languages")
class SpokenLanguageAdminController extends SectionAdminController<SpokenLanguage, SpokenLanguageDto> {

	SpokenLanguageAdminController(SectionService<SpokenLanguage, SpokenLanguageDto> service) {
		super(service);
	}
}
