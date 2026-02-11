package com.neria.manager.ocr;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neria.manager.common.entities.OcrDocument;
import com.neria.manager.common.repos.OcrDocumentRepository;
import com.neria.manager.common.services.EncryptionService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OcrDocumentsService {
  private final OcrDocumentRepository repository;
  private final EncryptionService encryptionService;
  private final ObjectMapper objectMapper;

  public OcrDocumentsService(
      OcrDocumentRepository repository,
      EncryptionService encryptionService,
      ObjectMapper objectMapper) {
    this.repository = repository;
    this.encryptionService = encryptionService;
    this.objectMapper = objectMapper;
  }

  public List<OcrDocument> list(String tenantId) {
    return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
  }

  public OcrDocument create(String tenantId, CreateOcrDocumentRequest dto) {
    OcrDocument doc = new OcrDocument();
    doc.setId(UUID.randomUUID().toString());
    doc.setTenantId(tenantId);
    doc.setTitle(dto.title);
    doc.setSource(dto.source);
    doc.setEncryptedContent(encryptionService.encrypt(dto.content));
    doc.setMetadata(toJson(dto.metadata != null ? dto.metadata : Map.of()));
    doc.setEnabled(dto.enabled != null ? dto.enabled : true);
    doc.setCreatedAt(LocalDateTime.now());
    doc.setUpdatedAt(LocalDateTime.now());
    return repository.save(doc);
  }

  public OcrDocument update(String tenantId, String id, UpdateOcrDocumentRequest dto) {
    OcrDocument doc =
        repository
            .findByIdAndTenantId(id, tenantId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OCR document not found"));

    if (dto.title != null) {
      doc.setTitle(dto.title);
    }
    if (dto.source != null) {
      doc.setSource(dto.source);
    }
    if (dto.content != null) {
      doc.setEncryptedContent(encryptionService.encrypt(dto.content));
    }
    if (dto.metadata != null) {
      doc.setMetadata(toJson(dto.metadata));
    }
    if (dto.enabled != null) {
      doc.setEnabled(dto.enabled);
    }
    doc.setUpdatedAt(LocalDateTime.now());
    return repository.save(doc);
  }

  public OcrDocument getById(String tenantId, String id) {
    return repository
        .findByIdAndTenantId(id, tenantId)
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "OCR document not found"));
  }

  public String getDecryptedContent(OcrDocument doc) {
    return encryptionService.decrypt(doc.getEncryptedContent());
  }

  private String toJson(Object payload) {
    try {
      return objectMapper.writeValueAsString(payload);
    } catch (JsonProcessingException ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid JSON payload");
    }
  }

  public static class CreateOcrDocumentRequest {
    public String title;
    public String source;
    public String content;
    public Map<String, Object> metadata;
    public Boolean enabled;
  }

  public static class UpdateOcrDocumentRequest {
    public String title;
    public String source;
    public String content;
    public Map<String, Object> metadata;
    public Boolean enabled;
  }
}
