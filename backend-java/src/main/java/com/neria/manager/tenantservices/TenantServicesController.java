package com.neria.manager.tenantservices;

import com.neria.manager.common.security.AuthContext;
import com.neria.manager.common.security.AuthUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/tenants/{tenantId}/services")
public class TenantServicesController {
  private final TenantServicesService service;

  public TenantServicesController(TenantServicesService service) {
    this.service = service;
  }

  private AuthContext requireScope(HttpServletRequest request, String tenantId) {
    AuthContext auth = AuthUtils.requireAuth(request);
    AuthUtils.requireRole(auth, "admin", "tenant");
    AuthUtils.requireTenantScope(auth, tenantId);
    return auth;
  }

  @GetMapping
  public Object list(HttpServletRequest request, @PathVariable String tenantId) {
    requireScope(request, tenantId);
    return service.listServices(tenantId);
  }

  @PatchMapping("/{serviceCode}/config")
  public Object updateConfig(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @RequestBody UpdateConfigRequest dto) {
    requireScope(request, tenantId);
    return service.updateConfig(
        tenantId,
        serviceCode,
        dto.status,
        dto.systemPrompt,
        dto.apiBaseUrl,
        dto.providerId,
        dto.pricingId,
        dto.policyId);
  }

  @GetMapping("/{serviceCode}/endpoints")
  public Object listEndpoints(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode) {
    requireScope(request, tenantId);
    return service.listEndpoints(tenantId, serviceCode);
  }

  @PostMapping("/{serviceCode}/endpoints")
  public Object createEndpoint(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @RequestBody TenantServicesService.CreateEndpointRequest dto) {
    requireScope(request, tenantId);
    return service.createEndpoint(tenantId, serviceCode, dto);
  }

  @PatchMapping("/{serviceCode}/endpoints/{id}")
  public Object updateEndpoint(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String id,
      @RequestBody TenantServicesService.UpdateEndpointRequest dto) {
    requireScope(request, tenantId);
    return service.updateEndpoint(tenantId, serviceCode, id, dto);
  }

  @DeleteMapping("/{serviceCode}/endpoints/{id}")
  public Object deleteEndpoint(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String id) {
    requireScope(request, tenantId);
    return service.deleteEndpoint(tenantId, serviceCode, id);
  }

  @GetMapping("/{serviceCode}/users")
  public Object listUsers(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode) {
    requireScope(request, tenantId);
    return service.listServiceUsers(tenantId, serviceCode);
  }

  @PostMapping("/{serviceCode}/users")
  public Object assignUser(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @RequestBody TenantServiceUserRequest dto) {
    requireScope(request, tenantId);
    return service.assignUser(tenantId, serviceCode, dto.userId, dto.status);
  }

  @PatchMapping("/{serviceCode}/users/{userId}")
  public Object updateUser(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String userId,
      @RequestBody TenantServiceUserRequest dto) {
    requireScope(request, tenantId);
    return service.updateServiceUser(tenantId, serviceCode, userId, dto.status);
  }

  @DeleteMapping("/{serviceCode}/users/{userId}")
  public Object removeUser(
      HttpServletRequest request,
      @PathVariable String tenantId,
      @PathVariable String serviceCode,
      @PathVariable String userId) {
    requireScope(request, tenantId);
    return service.removeServiceUser(tenantId, serviceCode, userId);
  }

  public static class TenantServiceUserRequest {
    public String userId;
    public String status;
  }

  public static class UpdateConfigRequest {
    public String status;
    public String systemPrompt;
    public String apiBaseUrl;
    public String providerId;
    public String pricingId;
    public String policyId;
  }
}
