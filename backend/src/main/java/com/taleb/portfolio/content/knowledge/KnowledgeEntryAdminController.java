package com.taleb.portfolio.content.knowledge;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.SectionAdminController;
import com.taleb.portfolio.common.SectionService;

@Tag(name = "Admin · Fiches assistant", description = "Fiches lues uniquement par l'assistant IA")
@RestController
@RequestMapping("/api/admin/knowledge")
class KnowledgeEntryAdminController extends SectionAdminController<KnowledgeEntry, KnowledgeEntryDto> {

	KnowledgeEntryAdminController(SectionService<KnowledgeEntry, KnowledgeEntryDto> service) {
		super(service);
	}
}
