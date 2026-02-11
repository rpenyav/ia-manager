package com.neria.manager.docs;

import com.neria.manager.common.entities.DocumentationEntry;
import com.neria.manager.common.repos.DocumentationEntryRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DocsService {
  private final DocumentationEntryRepository repository;

  public DocsService(DocumentationEntryRepository repository) {
    this.repository = repository;
  }

  public List<DocumentationEntry> list(String menuSlug, String category, Boolean enabled, String search) {
    String normalizedMenu = normalizeSlug(menuSlug);
    String normalizedCategory = normalizeSlug(category);
    if (normalizedMenu == null && normalizedCategory == null && enabled == null && (search == null || search.isBlank())) {
      return repository.findAllByOrderByCategoryAscOrderIndexAscCreatedAtAsc();
    }
    return repository.search(normalizedMenu, normalizedCategory, enabled, search != null ? search.trim() : null);
  }

  public DocumentationEntry getById(String id) {
    return repository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documentation entry not found"));
  }

  public DocumentationEntry create(CreateDocRequest dto) {
    DocumentationEntry entry = new DocumentationEntry();
    entry.setId(java.util.UUID.randomUUID().toString());
    entry.setMenuSlug(normalizeSlug(dto.menuSlug));
    entry.setCategory(normalizeCategory(dto.category));
    entry.setTitle(dto.title);
    entry.setContent(dto.content);
    entry.setLink(dto.link);
    entry.setOrderIndex(dto.orderIndex != null ? dto.orderIndex : 0);
    entry.setEnabled(dto.enabled != null ? dto.enabled : true);
    entry.setCreatedAt(LocalDateTime.now());
    entry.setUpdatedAt(LocalDateTime.now());
    return repository.save(entry);
  }

  public DocumentationEntry update(String id, UpdateDocRequest dto) {
    DocumentationEntry entry = repository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documentation entry not found"));

    if (dto.menuSlug != null) {
      entry.setMenuSlug(normalizeSlug(dto.menuSlug));
    }
    if (dto.category != null) {
      entry.setCategory(normalizeCategory(dto.category));
    }
    if (dto.title != null) {
      entry.setTitle(dto.title);
    }
    if (dto.content != null) {
      entry.setContent(dto.content);
    }
    if (dto.link != null) {
      entry.setLink(dto.link);
    }
    if (dto.orderIndex != null) {
      entry.setOrderIndex(dto.orderIndex);
    }
    if (dto.enabled != null) {
      entry.setEnabled(dto.enabled);
    }
    entry.setUpdatedAt(LocalDateTime.now());
    return repository.save(entry);
  }

  public java.util.Map<String, Object> remove(String id) {
    DocumentationEntry entry = repository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Documentation entry not found"));
    repository.delete(entry);
    return java.util.Map.of("id", id);
  }

  private String normalizeSlug(String value) {
    if (value == null) {
      return null;
    }
    return value.trim().toLowerCase();
  }

  private String normalizeCategory(String value) {
    if (value == null || value.isBlank()) {
      return "general";
    }
    return normalizeSlug(value);
  }

  public static class CreateDocRequest {
    public String menuSlug;
    public String category;
    public String title;
    public String content;
    public String link;
    public Integer orderIndex;
    public Boolean enabled;
  }

  public static class UpdateDocRequest {
    public String menuSlug;
    public String category;
    public String title;
    public String content;
    public String link;
    public Integer orderIndex;
    public Boolean enabled;
  }
}
