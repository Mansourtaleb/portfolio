package com.taleb.portfolio.common;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.NoRepositoryBean;

/** Dépôt générique des sections « liste », toujours triées par ordre d'affichage. */
@NoRepositoryBean
public interface SectionRepository<E extends SectionEntity> extends JpaRepository<E, Long> {

	List<E> findAllByOrderBySortOrderAscIdAsc();

	List<E> findByVisibleTrueOrderBySortOrderAscIdAsc();

	@Query("select coalesce(max(e.sortOrder), 0) from #{#entityName} e")
	int findMaxSortOrder();
}
