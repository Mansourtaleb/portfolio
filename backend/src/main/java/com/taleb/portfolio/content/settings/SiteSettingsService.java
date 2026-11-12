package com.taleb.portfolio.content.settings;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.taleb.portfolio.common.ContentChangedEvent;
import com.taleb.portfolio.common.NotFoundException;

@Service
public class SiteSettingsService {

	private final SiteSettingsRepository repository;
	private final ApplicationEventPublisher events;

	SiteSettingsService(SiteSettingsRepository repository, ApplicationEventPublisher events) {
		this.repository = repository;
		this.events = events;
	}

	@Transactional(readOnly = true)
	public SiteSettingsDto get() {
		return SiteSettingsDto.from(load());
	}

	@Transactional
	public SiteSettingsDto update(SiteSettingsDto dto) {
		SiteSettings settings = load();
		dto.applyTo(settings);
		events.publishEvent(new ContentChangedEvent("settings"));
		return SiteSettingsDto.from(settings);
	}

	private SiteSettings load() {
		return repository.findById(SiteSettings.SINGLETON_ID)
				.orElseThrow(() -> new NotFoundException("Réglages non initialisés"));
	}
}
