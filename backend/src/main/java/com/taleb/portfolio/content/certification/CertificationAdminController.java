package com.taleb.portfolio.content.certification;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.SectionAdminController;
import com.taleb.portfolio.common.SectionService;

@RestController
@RequestMapping("/api/admin/certifications")
class CertificationAdminController extends SectionAdminController<Certification, CertificationDto> {

	CertificationAdminController(SectionService<Certification, CertificationDto> service) {
		super(service);
	}
}
