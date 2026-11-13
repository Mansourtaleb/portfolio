package com.taleb.portfolio.content.testimonial;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.taleb.portfolio.common.SectionAdminController;
import com.taleb.portfolio.common.SectionService;

import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Admin · Témoignages", description = "CRUD des recommandations")
@RestController
@RequestMapping("/api/admin/testimonials")
class TestimonialAdminController extends SectionAdminController<Testimonial, TestimonialDto> {

	TestimonialAdminController(SectionService<Testimonial, TestimonialDto> service) {
		super(service);
	}
}
