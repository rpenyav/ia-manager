package com.neria.manager.docs;

import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/docs")
public class DocsController {
  private final DocsService service;

  public DocsController(DocsService service) {
    this.service = service;
  }

  @GetMapping
  public Object list(
      HttpServletRequest request,
      @RequestParam(name = "menuSlug", required = false) String menuSlug,
      @RequestParam(name = "category", required = false) String category,
      @RequestParam(name = "enabled", required = false) String enabled,
      @RequestParam(name = "q", required = false) String q) {
    AuthUtils.requireAuth(request);
    Boolean enabledBool = null;
    if (enabled != null) {
      enabledBool = enabled.equalsIgnoreCase("true") || enabled.equals("1");
    }
    return service.list(menuSlug, category, enabledBool, q);
  }

  @GetMapping("/{id}")
  public Object getById(HttpServletRequest request, @PathVariable String id) {
    AuthUtils.requireAuth(request);
    return service.getById(id);
  }

  @PostMapping
  public Object create(
      HttpServletRequest request, @RequestBody DocsService.CreateDocRequest dto) {
    AuthUtils.requireAuth(request);
    return service.create(dto);
  }

  @PatchMapping("/{id}")
  public Object update(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestBody DocsService.UpdateDocRequest dto) {
    AuthUtils.requireAuth(request);
    return service.update(id, dto);
  }

  @DeleteMapping("/{id}")
  public Object remove(HttpServletRequest request, @PathVariable String id) {
    AuthUtils.requireAuth(request);
    return service.remove(id);
  }
}
