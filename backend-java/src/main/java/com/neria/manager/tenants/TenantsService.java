package com.neria.manager.tenants;

import com.neria.manager.auth.TenantAuthService;
import com.neria.manager.common.entities.Tenant;
import com.neria.manager.common.repos.TenantRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class TenantsService {
  private final TenantRepository repository;
  private final TenantAuthService tenantAuthService;

  public TenantsService(TenantRepository repository, TenantAuthService tenantAuthService) {
    this.repository = repository;
    this.tenantAuthService = tenantAuthService;
  }

  public List<Tenant> list(String tenantId) {
    if (tenantId != null && !tenantId.isBlank()) {
      return repository.findById(tenantId).map(List::of).orElse(List.of());
    }
    return repository.findAll();
  }

  public Tenant create(CreateTenantRequest dto) {
    Tenant tenant = new Tenant();
    tenant.setId(UUID.randomUUID().toString());
    tenant.setName(dto.name);
    tenant.setStatus(dto.status != null ? dto.status : "active");
    tenant.setKillSwitch(dto.killSwitch != null ? dto.killSwitch : false);
    tenant.setAuthUsername(dto.authUsername);
    tenant.setLanguage("es");
    if (dto.authPassword != null && !dto.authPassword.isBlank()) {
      tenant.setAuthPasswordHash(tenantAuthService.hashPassword(dto.authPassword));
      tenant.setAuthMustChangePassword(true);
    }
    tenant.setCreatedAt(LocalDateTime.now());
    tenant.setUpdatedAt(LocalDateTime.now());
    return repository.save(tenant);
  }

  public Tenant update(String tenantId, UpdateTenantRequest dto) {
    Tenant tenant = repository.findById(tenantId).orElseThrow();
    if (dto.name != null) {
      tenant.setName(dto.name);
    }
    if (dto.status != null) {
      tenant.setStatus(dto.status);
    }
    if (dto.killSwitch != null) {
      tenant.setKillSwitch(dto.killSwitch);
    }
    if (dto.authUsername != null) {
      tenant.setAuthUsername(dto.authUsername);
    }
    if (dto.authPassword != null && !dto.authPassword.isBlank()) {
      tenant.setAuthPasswordHash(tenantAuthService.hashPassword(dto.authPassword));
      tenant.setAuthMustChangePassword(true);
    }
    if (dto.billingEmail != null) {
      tenant.setBillingEmail(dto.billingEmail);
    }
    if (dto.language != null) {
      tenant.setLanguage(dto.language);
    }
    applyProfileFields(tenant, dto);
    tenant.setUpdatedAt(LocalDateTime.now());
    return repository.save(tenant);
  }

  public Tenant updateSelf(String tenantId, UpdateTenantSelfRequest dto) {
    Tenant tenant = repository.findById(tenantId).orElseThrow();
    if (dto.name != null) {
      tenant.setName(dto.name);
    }
    if (dto.billingEmail != null) {
      tenant.setBillingEmail(dto.billingEmail);
    }
    if (dto.language != null) {
      tenant.setLanguage(dto.language);
    }
    if (dto.authPassword != null && !dto.authPassword.isBlank()) {
      tenant.setAuthPasswordHash(tenantAuthService.hashPassword(dto.authPassword));
      tenant.setAuthMustChangePassword(false);
    }
    applyProfileFields(tenant, dto);
    tenant.setUpdatedAt(LocalDateTime.now());
    return repository.save(tenant);
  }

  public Tenant toggleKillSwitch(String tenantId, boolean enabled) {
    Tenant tenant = repository.findById(tenantId).orElseThrow();
    tenant.setKillSwitch(enabled);
    tenant.setUpdatedAt(LocalDateTime.now());
    return repository.save(tenant);
  }

  public Tenant getById(String tenantId) {
    return repository.findById(tenantId).orElse(null);
  }

  private void applyProfileFields(Tenant tenant, UpdateTenantBase dto) {
    if (dto.companyName != null) tenant.setCompanyName(dto.companyName);
    if (dto.contactName != null) tenant.setContactName(dto.contactName);
    if (dto.phone != null) tenant.setPhone(dto.phone);
    if (dto.addressLine1 != null) tenant.setAddressLine1(dto.addressLine1);
    if (dto.addressLine2 != null) tenant.setAddressLine2(dto.addressLine2);
    if (dto.city != null) tenant.setCity(dto.city);
    if (dto.postalCode != null) tenant.setPostalCode(dto.postalCode);
    if (dto.country != null) tenant.setCountry(dto.country);
    if (dto.billingAddressLine1 != null) tenant.setBillingAddressLine1(dto.billingAddressLine1);
    if (dto.billingAddressLine2 != null) tenant.setBillingAddressLine2(dto.billingAddressLine2);
    if (dto.billingCity != null) tenant.setBillingCity(dto.billingCity);
    if (dto.billingPostalCode != null) tenant.setBillingPostalCode(dto.billingPostalCode);
    if (dto.billingCountry != null) tenant.setBillingCountry(dto.billingCountry);
    if (dto.taxId != null) tenant.setTaxId(dto.taxId);
    if (dto.website != null) tenant.setWebsite(dto.website);
    if (dto.language != null) tenant.setLanguage(dto.language);
  }

  public static class UpdateTenantBase {
    public String companyName;
    public String contactName;
    public String phone;
    public String addressLine1;
    public String addressLine2;
    public String city;
    public String postalCode;
    public String country;
    public String billingAddressLine1;
    public String billingAddressLine2;
    public String billingCity;
    public String billingPostalCode;
    public String billingCountry;
    public String taxId;
    public String website;
    public String language;
  }

  public static class CreateTenantRequest extends UpdateTenantBase {
    public String name;
    public String status;
    public Boolean killSwitch;
    public String authUsername;
    public String authPassword;
  }

  public static class UpdateTenantRequest extends UpdateTenantBase {
    public String name;
    public String status;
    public Boolean killSwitch;
    public String authUsername;
    public String authPassword;
    public String billingEmail;
    public String language;
  }

  public static class UpdateTenantSelfRequest extends UpdateTenantBase {
    public String name;
    public String billingEmail;
    public String authPassword;
    public String language;
  }
}
