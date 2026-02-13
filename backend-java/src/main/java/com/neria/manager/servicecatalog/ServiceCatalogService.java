package com.neria.manager.servicecatalog;

import com.neria.manager.common.entities.ServiceCatalog;
import com.neria.manager.common.repos.ServiceCatalogRepository;
import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.regex.Pattern;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ServiceCatalogService {
  private final ServiceCatalogRepository repository;
  private static final Pattern CODE_PATTERN = Pattern.compile("^[a-z0-9-]{3,64}$");

  public ServiceCatalogService(ServiceCatalogRepository repository) {
    this.repository = repository;
  }

  public List<ServiceCatalog> list() {
    return repository.findAllByOrderByNameAsc();
  }

  public ServiceCatalog create(CreateServiceCatalogRequest dto) {
    String code = validateCode(normalize(dto.code));
    if (repository.findByCode(code).isPresent()) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Service code already exists");
    }
    String name = normalize(dto.name);
    if (name.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Service name required");
    }
    String description = normalize(dto.description);
    if (description.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Service description required");
    }
    String apiBaseUrl = normalize(dto.apiBaseUrl);
    if (apiBaseUrl.isBlank()) {
      apiBaseUrl = null;
    }
    if (dto.priceMonthlyEur == null || dto.priceAnnualEur == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Service prices required");
    }
    validatePrice(dto.priceMonthlyEur, "monthly");
    validatePrice(dto.priceAnnualEur, "annual");

    ServiceCatalog item = new ServiceCatalog();
    item.setId(UUID.randomUUID().toString());
    item.setCode(code);
    item.setName(name);
    item.setDescription(description);
    item.setApiBaseUrl(apiBaseUrl);
    item.setPriceMonthlyEur(dto.priceMonthlyEur);
    item.setPriceAnnualEur(dto.priceAnnualEur);
    item.setEnabled(dto.enabled != null ? dto.enabled : true);
    item.setEndpointsEnabled(dto.endpointsEnabled != null ? dto.endpointsEnabled : true);
    item.setCreatedAt(LocalDateTime.now());
    item.setUpdatedAt(LocalDateTime.now());
    return repository.save(item);
  }

  public ServiceCatalog update(String id, UpdateServiceCatalogRequest dto) {
    ServiceCatalog item =
        repository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Service not found"));
    if (dto.code != null) {
      String code = validateCode(normalize(dto.code));
      repository.findByCode(code).ifPresent(existing -> {
        if (!existing.getId().equals(id)) {
          throw new ResponseStatusException(HttpStatus.CONFLICT, "Service code already exists");
        }
      });
      item.setCode(code);
    }
    if (dto.name != null) {
      String name = normalize(dto.name);
      if (name.isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Service name required");
      }
      item.setName(name);
    }
    if (dto.description != null) {
      String description = normalize(dto.description);
      if (description.isBlank()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Service description required");
      }
      item.setDescription(description);
    }
    if (dto.apiBaseUrl != null) {
      String apiBaseUrl = normalize(dto.apiBaseUrl);
      item.setApiBaseUrl(apiBaseUrl.isBlank() ? null : apiBaseUrl);
    }
    if (dto.priceMonthlyEur != null) {
      validatePrice(dto.priceMonthlyEur, "monthly");
      item.setPriceMonthlyEur(dto.priceMonthlyEur);
    }
    if (dto.priceAnnualEur != null) {
      validatePrice(dto.priceAnnualEur, "annual");
      item.setPriceAnnualEur(dto.priceAnnualEur);
    }
    if (dto.enabled != null) item.setEnabled(dto.enabled);
    if (dto.endpointsEnabled != null) item.setEndpointsEnabled(dto.endpointsEnabled);
    item.setUpdatedAt(LocalDateTime.now());
    return repository.save(item);
  }

  public void delete(String id) {
    ServiceCatalog item =
        repository
            .findById(id)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Service not found"));
    try {
      repository.delete(item);
    } catch (DataIntegrityViolationException ex) {
      throw new ResponseStatusException(
          HttpStatus.CONFLICT, "Service is in use and cannot be deleted");
    }
  }

  private String normalize(String value) {
    return value == null ? "" : value.trim();
  }

  private String validateCode(String code) {
    if (code.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Service code required");
    }
    if (!CODE_PATTERN.matcher(code).matches()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "Service code must be 3-64 chars, lowercase letters, numbers, or dashes");
    }
    return code;
  }

  private void validatePrice(BigDecimal value, String label) {
    if (value.compareTo(BigDecimal.ZERO) <= 0) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Service " + label + " price must be > 0");
    }
  }

  public static class CreateServiceCatalogRequest {
    public String code;
    public String name;
    public String description;
    public String apiBaseUrl;
    public BigDecimal priceMonthlyEur;
    public BigDecimal priceAnnualEur;
    public Boolean enabled;
    public Boolean endpointsEnabled;
  }

  public static class UpdateServiceCatalogRequest {
    public String code;
    public String name;
    public String description;
    public String apiBaseUrl;
    public BigDecimal priceMonthlyEur;
    public BigDecimal priceAnnualEur;
    public Boolean enabled;
    public Boolean endpointsEnabled;
  }
}
