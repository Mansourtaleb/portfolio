package com.taleb.portfolio.common;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.function.Supplier;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

/**
 * CRUD générique d'une section « liste » de la vitrine.
 * Une instance par section est déclarée dans {@code ContentConfig}.
 */
public class SectionService<E extends SectionEntity, D extends SectionDto<E>> {

	private final String section;
	private final SectionRepository<E> repository;
	private final Supplier<E> factory;
	private final Function<E, D> mapper;
	private final ApplicationEventPublisher events;

	public SectionService(String section, SectionRepository<E> repository, Supplier<E> factory,
			Function<E, D> mapper, ApplicationEventPublisher events) {
		this.section = section;
		this.repository = repository;
		this.factory = factory;
		this.mapper = mapper;
		this.events = events;
	}

	public String section() {
		return section;
	}

	@Transactional(readOnly = true)
	public List<D> findAll() {
		return repository.findAllByOrderBySortOrderAscIdAsc().stream().map(mapper).toList();
	}

	@Transactional(readOnly = true)
	public List<D> findVisible() {
		return repository.findByVisibleTrueOrderBySortOrderAscIdAsc().stream().map(mapper).toList();
	}

	@Transactional(readOnly = true)
	public D findById(Long id) {
		return mapper.apply(load(id));
	}

	@Transactional
	public D create(D dto) {
		E entity = factory.get();
		dto.applyTo(entity);
		entity.setSortOrder(dto.sortOrder() != null ? dto.sortOrder() : repository.findMaxSortOrder() + 1);
		entity.setVisible(Texts.orDefault(dto.visible(), true));
		E saved = repository.save(entity);
		changed();
		return mapper.apply(saved);
	}

	@Transactional
	public D update(Long id, D dto) {
		E entity = load(id);
		dto.applyTo(entity);
		if (dto.sortOrder() != null) {
			entity.setSortOrder(dto.sortOrder());
		}
		if (dto.visible() != null) {
			entity.setVisible(dto.visible());
		}
		changed();
		return mapper.apply(entity);
	}

	@Transactional
	public void delete(Long id) {
		repository.delete(load(id));
		changed();
	}

	/** Réordonne la section : la position de chaque id dans la liste devient son ordre d'affichage. */
	@Transactional
	public List<D> reorder(List<Long> orderedIds) {
		Map<Long, Integer> positions = new HashMap<>();
		for (int i = 0; i < orderedIds.size(); i++) {
			positions.put(orderedIds.get(i), i + 1);
		}
		List<E> all = repository.findAll();
		for (E entity : all) {
			Integer position = positions.get(entity.getId());
			if (position != null) {
				entity.setSortOrder(position);
			}
		}
		changed();
		return findAll();
	}

	private E load(Long id) {
		return repository.findById(id)
				.orElseThrow(() -> new NotFoundException("Élément introuvable (" + section + " #" + id + ")"));
	}

	private void changed() {
		events.publishEvent(new ContentChangedEvent(section));
	}
}
