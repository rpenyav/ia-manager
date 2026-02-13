package com.neria.manager.servicecatalog;

import com.neria.manager.common.entities.ServiceCatalog;
import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/services/catalog")
public class ServiceCatalogController {
  private final ServiceCatalogService serviceCatalogService;

  public ServiceCatalogController(ServiceCatalogService serviceCatalogService) {
    this.serviceCatalogService = serviceCatalogService;
  }

  @GetMapping
  public List<ServiceCatalog> list(HttpServletRequest request) {
    AuthUtils.requireAuth(request);
    return serviceCatalogService.list();
  }

  @PostMapping
  public ServiceCatalog create(
      HttpServletRequest request,
      @RequestBody ServiceCatalogService.CreateServiceCatalogRequest dto) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireAdmin(auth);
    return serviceCatalogService.create(dto);
  }

  @PatchMapping("/{id}")
  public ServiceCatalog update(
      HttpServletRequest request,
      @PathVariable String id,
      @RequestBody ServiceCatalogService.UpdateServiceCatalogRequest dto) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireAdmin(auth);
    return serviceCatalogService.update(id, dto);
  }

  @DeleteMapping("/{id}")
  public void delete(HttpServletRequest request, @PathVariable String id) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireAdmin(auth);
    serviceCatalogService.delete(id);
  }

}
