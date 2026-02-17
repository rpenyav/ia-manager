package com.neria.manager.common.repos;

import com.neria.manager.common.entities.DocumentationEntry;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

public interface DocumentationEntryRepository extends JpaRepository<DocumentationEntry, String> {
  List<DocumentationEntry> findByMenuSlugAndEnabledOrderByOrderIndexAsc(String menuSlug, boolean enabled);

  List<DocumentationEntry> findAllByOrderByCategoryAscOrderIndexAscCreatedAtAsc();

  @Query(
      "select d from DocumentationEntry d "
          + "where (:menuSlug is null or d.menuSlug = :menuSlug) "
          + "and (:category is null or d.category = :category) "
          + "and (:enabled is null or d.enabled = :enabled) "
          + "and (:q is null "
          + "or d.title like %:q% or d.content like %:q% "
          + "or d.titleEn like %:q% or d.contentEn like %:q% "
          + "or d.titleCa like %:q% or d.contentCa like %:q%) "
          + "order by d.category asc, d.orderIndex asc, d.createdAt asc")
  List<DocumentationEntry> search(
      @Param("menuSlug") String menuSlug,
      @Param("category") String category,
      @Param("enabled") Boolean enabled,
      @Param("q") String q);
}
