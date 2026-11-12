package com.taleb.portfolio.common;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/**
 * Endpoints CRUD de l'espace admin, communs à toutes les sections « liste ».
 * Chaque section n'a qu'à hériter de cette classe et déclarer son chemin.
 */
public abstract class SectionAdminController<E extends SectionEntity, D extends SectionDto<E>> {

	private final SectionService<E, D> service;

	protected SectionAdminController(SectionService<E, D> service) {
		this.service = service;
	}

	@GetMapping
	public List<D> list() {
		return service.findAll();
	}

	@GetMapping("/{id}")
	public D get(@PathVariable Long id) {
		return service.findById(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public D create(@Valid @RequestBody D dto) {
		return service.create(dto);
	}

	@PutMapping("/{id}")
	public D update(@PathVariable Long id, @Valid @RequestBody D dto) {
		return service.update(id, dto);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable Long id) {
		service.delete(id);
	}

	@PutMapping("/order")
	public List<D> reorder(@RequestBody @NotNull List<Long> orderedIds) {
		return service.reorder(orderedIds);
	}
}
