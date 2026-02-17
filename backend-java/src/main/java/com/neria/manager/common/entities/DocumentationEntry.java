package com.neria.manager.common.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "documentation_entries")
public class DocumentationEntry {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "menuSlug", length = 64, nullable = false)
  private String menuSlug;

  @Column(length = 64, nullable = false)
  private String category;

  @Column(length = 160, nullable = false)
  private String title;

  @Column(columnDefinition = "text", nullable = false)
  private String content;

  @Column(name = "title_en", length = 160)
  private String titleEn;

  @Column(name = "content_en", columnDefinition = "text")
  private String contentEn;

  @Column(name = "title_ca", length = 160)
  private String titleCa;

  @Column(name = "content_ca", columnDefinition = "text")
  private String contentCa;

  @Column(length = 255)
  private String link;

  @Column(name = "orderIndex", nullable = false)
  private int orderIndex;

  @Column(nullable = false)
  private boolean enabled;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;

  @Column(name = "updatedAt")
  private LocalDateTime updatedAt;
}
