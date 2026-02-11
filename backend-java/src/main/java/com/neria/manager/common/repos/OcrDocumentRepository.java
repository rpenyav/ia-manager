package com.neria.manager.common.repos;

import com.neria.manager.common.entities.OcrDocument;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OcrDocumentRepository extends JpaRepository<OcrDocument, String> {
  List<OcrDocument> findByTenantIdOrderByCreatedAtDesc(String tenantId);

  Optional<OcrDocument> findByIdAndTenantId(String id, String tenantId);
}
