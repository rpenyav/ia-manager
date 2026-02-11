package com.neria.manager.ocr;

import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ocr-documents")
public class OcrDocumentsController {
  private final OcrDocumentsService service;

  public OcrDocumentsController(OcrDocumentsService service) {
    this.service = service;
  }

  @GetMapping
  public Object list(HttpServletRequest request) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String tenantId = AuthUtils.resolveTenantId(auth, request);
    return service.list(tenantId);
  }

  @PostMapping
  public Object create(
      HttpServletRequest request, @RequestBody OcrDocumentsService.CreateOcrDocumentRequest dto) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String tenantId = AuthUtils.resolveTenantId(auth, request);
    return service.create(tenantId, dto);
  }

  @PatchMapping("/{id}")
  public Object update(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestBody OcrDocumentsService.UpdateOcrDocumentRequest dto) {
    AuthContext auth = AuthUtils.requireAuth(request);
    String tenantId = AuthUtils.resolveTenantId(auth, request);
    return service.update(tenantId, id, dto);
  }
}
