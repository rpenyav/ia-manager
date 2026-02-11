package com.neria.manager.pricing;

import com.neria.manager.common.entities.PricingModel;
import com.neria.manager.common.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/pricing")
public class PricingController {
  private final PricingService pricingService;

  public PricingController(PricingService pricingService) {
    this.pricingService = pricingService;
  }

  @GetMapping
  public List<PricingModel> list(HttpServletRequest request) {
    requireAuth(request);
    return pricingService.list();
  }

  @PostMapping
  public PricingModel create(
      HttpServletRequest request, @RequestBody PricingService.CreatePricingRequest dto) {
    requireAdmin(request);
    return pricingService.create(dto);
  }

  @PatchMapping("/{id}")
  public PricingModel update(
      HttpServletRequest request,
      @PathVariable("id") String id,
      @RequestBody PricingService.UpdatePricingRequest dto) {
    requireAdmin(request);
    return pricingService.update(id, dto);
  }

  private AuthContext requireAuth(HttpServletRequest request) {
    AuthContext auth = (AuthContext) request.getAttribute("auth");
    if (auth == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
    }
    return auth;
  }

  private void requireAdmin(HttpServletRequest request) {
    AuthContext auth = requireAuth(request);
    if (auth.getRole() == null || !auth.getRole().equals("admin")) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
    }
  }
}
