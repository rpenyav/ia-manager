package com.neria.manager.servicecatalog;

import com.neria.manager.common.entities.ServiceCatalog;
import com.neria.manager.common.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/services/catalog")
public class ServiceCatalogController {
  private final ServiceCatalogService serviceCatalogService;

  public ServiceCatalogController(ServiceCatalogService serviceCatalogService) {
    this.serviceCatalogService = serviceCatalogService;
  }

  @GetMapping
  public List<ServiceCatalog> list(HttpServletRequest request) {
    requireAuth(request);
    return serviceCatalogService.list();
  }

  private AuthContext requireAuth(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
    return auth;
  }
}
