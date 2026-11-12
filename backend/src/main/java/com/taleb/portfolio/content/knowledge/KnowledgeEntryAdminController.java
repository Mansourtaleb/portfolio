package com.taleb.portfolio.content.knowledge;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.SectionAdminController;
import com.taleb.portfolio.common.SectionService;

@RestController
@RequestMapping("/api/admin/knowledge")
class KnowledgeEntryAdminController extends SectionAdminController<KnowledgeEntry, KnowledgeEntryDto> {

	KnowledgeEntryAdminController(SectionService<KnowledgeEntry, KnowledgeEntryDto> service) {
		super(service);
	}
}
