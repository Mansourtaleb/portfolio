package com.taleb.portfolio.content.project;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ProjectImageRepository extends JpaRepository<ProjectImage, Long> {

	/** Métadonnées seules (sans les octets de l'image), triées pour l'affichage. */
	@Query("""
			select new com.taleb.portfolio.content.project.ProjectImageMeta(
			  i.id, i.projectId, i.caption, i.width, i.height, i.sizeBytes, i.updatedAt)
			from ProjectImage i where i.projectId = :projectId order by i.sortOrder, i.id""")
	List<ProjectImageMeta> findMeta(Long projectId);

	@Query("select count(i) from ProjectImage i where i.projectId = :projectId")
	long countByProject(Long projectId);

	@Query("select coalesce(max(i.sortOrder), 0) from ProjectImage i where i.projectId = :projectId")
	int maxSortOrder(Long projectId);

	@Modifying
	@Query("update ProjectImage i set i.sortOrder = :sortOrder where i.id = :id and i.projectId = :projectId")
	int updateSortOrder(Long projectId, Long id, int sortOrder);
}
