package com.neria.manager.common.repos;

import com.neria.manager.common.entities.PricingModel;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PricingModelRepository extends JpaRepository<PricingModel, String> {
  List<PricingModel> findAllByOrderByProviderTypeAscModelAsc();
  Optional<PricingModel> findByProviderTypeAndModelAndEnabled(String providerType, String model, boolean enabled);
  Optional<PricingModel> findByProviderTypeAndModel(String providerType, String model);
}
