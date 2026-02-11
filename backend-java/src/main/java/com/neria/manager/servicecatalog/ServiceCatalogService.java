package com.neria.manager.servicecatalog;

import com.neria.manager.common.entities.ServiceCatalog;
import com.neria.manager.common.repos.ServiceCatalogRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ServiceCatalogService {
  private final ServiceCatalogRepository repository;

  public ServiceCatalogService(ServiceCatalogRepository repository) {
    this.repository = repository;
  }

  public List<ServiceCatalog> list() {
    return repository.findAllByOrderByNameAsc();
  }
}
