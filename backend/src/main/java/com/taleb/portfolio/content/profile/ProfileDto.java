package com.taleb.portfolio.content.profile;

import java.util.List;

import com.taleb.portfolio.common.Texts;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProfileDto(
		@NotBlank(message = "Le nom est obligatoire") @Size(max = 120) String fullName,
		@NotBlank(message = "Le titre est obligatoire") @Size(max = 200) String headline,
		@Size(max = 300) String tagline,
		@Size(max = 4000) String summary,
		@Size(max = 120) String location,
		@Email(message = "E-mail invalide") @Size(max = 160) String email,
		@Size(max = 40) String phone,
		Boolean showPhone,
		@Size(max = 300) @Pattern(regexp = "^(https?://.*)?$", message = "URL http(s) attendue") String linkedinUrl,
		@Size(max = 300) @Pattern(regexp = "^(https?://.*)?$", message = "URL http(s) attendue") String githubUrl,
		@Size(max = 300) String cvUrl,
		@Size(max = 300) String avatarUrl,
		@Size(max = 160) String availability,
		List<@Size(max = 80) String> qualities,
		List<@Size(max = 200) String> extras) {

	public static ProfileDto from(Profile p) {
		return new ProfileDto(p.getFullName(), p.getHeadline(), p.getTagline(), p.getSummary(), p.getLocation(),
				p.getEmail(), p.getPhone(), p.isShowPhone(), p.getLinkedinUrl(), p.getGithubUrl(), p.getCvUrl(),
				p.getAvatarUrl(), p.getAvailability(), List.copyOf(p.getQualities()), List.copyOf(p.getExtras()));
	}

	public void applyTo(Profile p) {
		p.setFullName(Texts.clean(fullName));
		p.setHeadline(Texts.clean(headline));
		p.setTagline(Texts.clean(tagline));
		p.setSummary(Texts.clean(summary));
		p.setLocation(Texts.clean(location));
		p.setEmail(Texts.clean(email));
		p.setPhone(Texts.clean(phone));
		p.setShowPhone(Texts.orDefault(showPhone, false));
		p.setLinkedinUrl(Texts.clean(linkedinUrl));
		p.setGithubUrl(Texts.clean(githubUrl));
		p.setCvUrl(Texts.clean(cvUrl));
		p.setAvatarUrl(Texts.clean(avatarUrl));
		p.setAvailability(Texts.clean(availability));
		p.setQualities(Texts.cleanList(qualities));
		p.setExtras(Texts.cleanList(extras));
	}
}
