package com.taleb.portfolio.content.language;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.SectionAdminController;
import com.taleb.portfolio.common.SectionService;

@RestController
@RequestMapping("/api/admin/languages")
class SpokenLanguageAdminController extends SectionAdminController<SpokenLanguage, SpokenLanguageDto> {

	SpokenLanguageAdminController(SectionService<SpokenLanguage, SpokenLanguageDto> service) {
		super(service);
	}
}
