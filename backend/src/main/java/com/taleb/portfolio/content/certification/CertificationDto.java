package com.taleb.portfolio.content.certification;

import com.taleb.portfolio.common.SectionDto;
import com.taleb.portfolio.common.Texts;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CertificationDto(
		Long id,
		@NotBlank(message = "L'intitulé est obligatoire") @Size(max = 200) String name,
		@NotBlank(message = "L'organisme est obligatoire") @Size(max = 120) String issuer,
		@Size(max = 40) String issuedOn,
		@Size(max = 300) @Pattern(regexp = "^(https?://.*)?$", message = "URL http(s) attendue") String credentialUrl,
		Integer sortOrder,
		Boolean visible) implements SectionDto<Certification> {

	public static CertificationDto from(Certification e) {
		return new CertificationDto(e.getId(), e.getName(), e.getIssuer(), e.getIssuedOn(), e.getCredentialUrl(),
				e.getSortOrder(), e.isVisible());
	}

	@Override
	public void applyTo(Certification e) {
		e.setName(Texts.clean(name));
		e.setIssuer(Texts.clean(issuer));
		e.setIssuedOn(Texts.clean(issuedOn));
		e.setCredentialUrl(Texts.clean(credentialUrl));
	}
}
