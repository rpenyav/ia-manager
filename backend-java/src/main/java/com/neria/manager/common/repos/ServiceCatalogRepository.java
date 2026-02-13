package com.neria.manager.common.repos;

import com.neria.manager.common.entities.ServiceCatalog;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceCatalogRepository extends JpaRepository<ServiceCatalog, String> {
  List<ServiceCatalog> findAllByOrderByNameAsc();

  Optional<ServiceCatalog> findByCode(String code);

  List<ServiceCatalog> findAllByCodeIn(List<String> codes);
}
