package com.taleb.portfolio.common;

/**
 * Représentation d'un élément de section échangée avec l'espace admin.
 * Chaque DTO sait recopier ses champs éditables dans l'entité ({@link #applyTo}).
 */
public interface SectionDto<E extends SectionEntity> {

	Long id();

	Integer sortOrder();

	Boolean visible();

	/** Recopie les champs métier dans l'entité (hors id, ordre et visibilité, gérés par le service). */
	void applyTo(E entity);
}
