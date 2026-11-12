package com.taleb.portfolio.content.profile;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taleb.portfolio.common.ContentChangedEvent;
import com.taleb.portfolio.common.NotFoundException;

@Service
public class ProfileService {

	private final ProfileRepository repository;
	private final ApplicationEventPublisher events;

	ProfileService(ProfileRepository repository, ApplicationEventPublisher events) {
		this.repository = repository;
		this.events = events;
	}

	@Transactional(readOnly = true)
	public ProfileDto get() {
		return ProfileDto.from(load());
	}

	@Transactional
	public ProfileDto update(ProfileDto dto) {
		Profile profile = load();
		dto.applyTo(profile);
		events.publishEvent(new ContentChangedEvent("profile"));
		return ProfileDto.from(profile);
	}

	private Profile load() {
		return repository.findById(Profile.SINGLETON_ID)
				.orElseThrow(() -> new NotFoundException("Profil non initialisé"));
	}
}
