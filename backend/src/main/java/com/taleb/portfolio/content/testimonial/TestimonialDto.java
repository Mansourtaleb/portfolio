package com.taleb.portfolio.content.testimonial;

import com.taleb.portfolio.common.SectionDto;
import com.taleb.portfolio.common.Texts;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TestimonialDto(
		Long id,
		@NotBlank(message = "L'auteur est obligatoire") @Size(max = 120) String author,
		@Size(max = 160) String role,
		@Size(max = 160) String company,
		@Size(max = 160) String relationship,
		@NotBlank(message = "La citation est obligatoire") @Size(max = 2000) String quote,
		@Size(max = 300) @Pattern(regexp = "^(https?://.*)?$", message = "URL http(s) attendue") String linkedinUrl,
		Integer sortOrder,
		Boolean visible) implements SectionDto<Testimonial> {

	public static TestimonialDto from(Testimonial e) {
		return new TestimonialDto(e.getId(), e.getAuthor(), e.getRole(), e.getCompany(), e.getRelationship(),
				e.getQuote(), e.getLinkedinUrl(), e.getSortOrder(), e.isVisible());
	}

	@Override
	public void applyTo(Testimonial e) {
		e.setAuthor(Texts.clean(author));
		e.setRole(Texts.clean(role));
		e.setCompany(Texts.clean(company));
		e.setRelationship(Texts.clean(relationship));
		e.setQuote(Texts.clean(quote));
		e.setLinkedinUrl(Texts.clean(linkedinUrl));
	}
}
