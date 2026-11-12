package com.taleb.portfolio.content.certification;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.SectionAdminController;
import com.taleb.portfolio.common.SectionService;

@Tag(name = "Admin · Certifications", description = "CRUD des certifications")
@RestController
@RequestMapping("/api/admin/certifications")
class CertificationAdminController extends SectionAdminController<Certification, CertificationDto> {

	CertificationAdminController(SectionService<Certification, CertificationDto> service) {
		super(service);
	}
}
