package com.neria.manager.subscriptions;

import com.neria.manager.common.entities.ServiceCatalog;
import com.neria.manager.common.entities.Subscription;
import com.neria.manager.common.entities.SubscriptionHistory;
import com.neria.manager.common.entities.SubscriptionPaymentRequest;
import com.neria.manager.common.entities.SubscriptionService;
import com.neria.manager.common.entities.TenantInvoice;
import com.neria.manager.common.entities.TenantInvoiceItem;
import com.neria.manager.common.repos.ServiceCatalogRepository;
import com.neria.manager.common.repos.SubscriptionHistoryRepository;
import com.neria.manager.common.repos.SubscriptionPaymentRequestRepository;
import com.neria.manager.common.repos.SubscriptionRepository;
import com.neria.manager.common.repos.SubscriptionServiceRepository;
import com.neria.manager.common.repos.TenantInvoiceItemRepository;
import com.neria.manager.common.repos.TenantInvoiceRepository;
import com.neria.manager.common.services.EmailService;
import com.neria.manager.tenants.TenantsService;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import java.math.BigDecimal;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SubscriptionsService {
  private final SubscriptionRepository subscriptionRepository;
  private final SubscriptionServiceRepository subscriptionServiceRepository;
  private final SubscriptionHistoryRepository subscriptionHistoryRepository;
  private final SubscriptionPaymentRequestRepository paymentRepository;
  private final ServiceCatalogRepository catalogRepository;
  private final TenantInvoiceRepository invoiceRepository;
  private final TenantInvoiceItemRepository invoiceItemRepository;
  private final TenantsService tenantsService;
  private final EmailService emailService;

  public SubscriptionsService(
      SubscriptionRepository subscriptionRepository,
      SubscriptionServiceRepository subscriptionServiceRepository,
      SubscriptionHistoryRepository subscriptionHistoryRepository,
      SubscriptionPaymentRequestRepository paymentRepository,
      ServiceCatalogRepository catalogRepository,
      TenantInvoiceRepository invoiceRepository,
      TenantInvoiceItemRepository invoiceItemRepository,
      TenantsService tenantsService,
      EmailService emailService) {
    this.subscriptionRepository = subscriptionRepository;
    this.subscriptionServiceRepository = subscriptionServiceRepository;
    this.subscriptionHistoryRepository = subscriptionHistoryRepository;
    this.paymentRepository = paymentRepository;
    this.catalogRepository = catalogRepository;
    this.invoiceRepository = invoiceRepository;
    this.invoiceItemRepository = invoiceItemRepository;
    this.tenantsService = tenantsService;
    this.emailService = emailService;
  }

  private LocalDateTime buildPeriodEnd(LocalDateTime start, String period) {
    return "annual".equals(period) ? start.plusYears(1) : start.plusMonths(1);
  }

  private int countPeriods(LocalDateTime start, LocalDateTime end, String period) {
    if (end.isBefore(start)) {
      return 0;
    }
    if ("annual".equals(period)) {
      int years = end.getYear() - start.getYear();
      boolean reached =
          end.getMonthValue() > start.getMonthValue()
              || (end.getMonthValue() == start.getMonthValue()
                  && end.getDayOfMonth() >= start.getDayOfMonth());
      return years + (reached ? 1 : 0);
    }
    int months = (end.getYear() - start.getYear()) * 12 + (end.getMonthValue() - start.getMonthValue());
    boolean reached = end.getDayOfMonth() >= start.getDayOfMonth();
    return months + (reached ? 1 : 0);
  }

  private void reconcileServiceStates(String subscriptionId) {
    LocalDateTime now = LocalDateTime.now();
    List<SubscriptionService> pending =
        subscriptionServiceRepository.findBySubscriptionId(subscriptionId).stream()
            .filter(item -> "pending".equals(item.getStatus()))
            .filter(item -> item.getActivateAt() != null && !item.getActivateAt().isAfter(now))
            .toList();
    if (!pending.isEmpty()) {
      pending.forEach(item -> {
        item.setStatus("active");
        item.setActivateAt(null);
      });
      subscriptionServiceRepository.saveAll(pending);
    }

    List<SubscriptionService> pendingRemoval =
        subscriptionServiceRepository.findBySubscriptionId(subscriptionId).stream()
            .filter(item -> "pending_removal".equals(item.getStatus()))
            .filter(item -> item.getDeactivateAt() != null && !item.getDeactivateAt().isAfter(now))
            .toList();
    if (!pendingRemoval.isEmpty()) {
      subscriptionServiceRepository.deleteAll(pendingRemoval);
    }
  }

  private Map<String, Object> buildResponse(Subscription subscription) {
    if (subscription == null) {
      Map<String, Object> empty = new HashMap<>();
      empty.put("subscription", null);
      empty.put("services", List.of());
      empty.put("totals", null);
      return empty;
    }

    reconcileServiceStates(subscription.getId());

    List<SubscriptionService> services =
        subscriptionServiceRepository.findBySubscriptionId(subscription.getId());
    Map<String, ServiceCatalog> catalogMap =
        services.isEmpty()
            ? Map.of()
            : catalogRepository.findAllById(
                    services.stream().map(SubscriptionService::getServiceCode).distinct().toList())
                .stream()
                .collect(Collectors.toMap(ServiceCatalog::getCode, item -> item, (a, b) -> a));

    List<SubscriptionService> activeServices =
        services.stream()
            .filter(item -> "active".equals(item.getStatus()) || "pending_removal".equals(item.getStatus()))
            .toList();
    double servicesTotal =
        activeServices.stream().map(item -> item.getPriceEur().doubleValue()).reduce(0d, Double::sum);
    double basePrice = subscription.getBasePriceEur().doubleValue();
    LocalDateTime endDate =
        "cancelled".equals(subscription.getStatus())
            ? subscription.getCurrentPeriodEnd()
            : LocalDateTime.now();
    int periods =
        "pending".equals(subscription.getStatus())
            ? 0
            : countPeriods(subscription.getCurrentPeriodStart(), endDate, subscription.getPeriod());
    double billedSinceStart = periods * (basePrice + servicesTotal);

    List<Map<String, Object>> responseServices =
        services.stream()
            .map(
                item -> {
                  ServiceCatalog catalog = catalogMap.get(item.getServiceCode());
                  Map<String, Object> row = new HashMap<>();
                  row.put("serviceCode", item.getServiceCode());
                  row.put("status", item.getStatus());
                  row.put("activateAt", item.getActivateAt());
                  row.put("deactivateAt", item.getDeactivateAt());
                  row.put("priceEur", item.getPriceEur());
                  row.put("name", catalog != null ? catalog.getName() : null);
                  row.put("description", catalog != null ? catalog.getDescription() : null);
                  row.put("priceMonthlyEur", catalog != null ? catalog.getPriceMonthlyEur() : null);
                  row.put("priceAnnualEur", catalog != null ? catalog.getPriceAnnualEur() : null);
                  return row;
                })
            .toList();

    Map<String, Object> totals =
        Map.of(
            "basePriceEur",
            basePrice,
            "servicesPriceEur",
            servicesTotal,
            "totalEur",
            basePrice + servicesTotal,
            "billedSinceStartEur",
            billedSinceStart);

    return Map.of("subscription", subscription, "services", responseServices, "totals", totals);
  }

  private String getBillingMode() {
    String explicit = System.getenv("BILLING_PAYMENT_MODE");
    if ("stripe".equalsIgnoreCase(explicit) || "mock".equalsIgnoreCase(explicit)) {
      return explicit.toLowerCase();
    }
    String env = System.getenv().getOrDefault("APP_ENV", "development");
    return "production".equalsIgnoreCase(env) ? "stripe" : "mock";
  }

  private LocalDateTime getPaymentExpiresAt() {
    int ttlHours = Integer.parseInt(System.getenv().getOrDefault("SUBSCRIPTION_PAYMENT_TTL_HOURS", "48"));
    return LocalDateTime.now().plusHours(ttlHours);
  }

  private String hashToken(String token) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hashed = digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
      return Base64.getEncoder().encodeToString(hashed);
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to hash token", ex);
    }
  }

  private Session createStripeCheckoutSession(
      String tenantName,
      String email,
      String period,
      double basePriceEur,
      List<ServiceSummary> services,
      String paymentRequestId) {
    String secret = System.getenv("STRIPE_SECRET_KEY");
    if (secret == null || secret.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe not configured");
    }
    Stripe.apiKey = secret;
    String successUrl =
        System.getenv().getOrDefault(
            "STRIPE_SUCCESS_URL",
            System.getenv("FRONTEND_BASE_URL") + "/billing/success?session_id={CHECKOUT_SESSION_ID}");
    String cancelUrl =
        System.getenv().getOrDefault(
            "STRIPE_CANCEL_URL", System.getenv("FRONTEND_BASE_URL") + "/billing/cancel");

    List<SessionCreateParams.LineItem> lineItems = new ArrayList<>();
    lineItems.add(
        SessionCreateParams.LineItem.builder()
            .setQuantity(1L)
            .setPriceData(
                SessionCreateParams.LineItem.PriceData.builder()
                    .setCurrency("eur")
                    .setUnitAmount(Math.round(basePriceEur * 100))
                    .setProductData(
                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                            .setName("Suscripción base (" + period + ")")
                            .build())
                    .build())
            .build());
    for (ServiceSummary service : services) {
      lineItems.add(
          SessionCreateParams.LineItem.builder()
              .setQuantity(1L)
              .setPriceData(
                  SessionCreateParams.LineItem.PriceData.builder()
                      .setCurrency("eur")
                      .setUnitAmount(Math.round(service.priceEur * 100))
                      .setProductData(
                          SessionCreateParams.LineItem.PriceData.ProductData.builder()
                              .setName(service.name)
                              .build())
                      .build())
              .build());
    }

    SessionCreateParams params =
        SessionCreateParams.builder()
            .setMode(SessionCreateParams.Mode.PAYMENT)
            .setCustomerEmail(email)
            .setSuccessUrl(successUrl)
            .setCancelUrl(cancelUrl)
            .addAllLineItem(lineItems)
            .putMetadata("paymentRequestId", paymentRequestId)
            .putMetadata("tenantName", tenantName)
            .build();

    try {
      return Session.create(params);
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe session failed");
    }
  }

  private SubscriptionPaymentRequest createPaymentRequest(
      String tenantId,
      String subscriptionId,
      String email,
      double amountEur,
      List<ServiceSummary> services,
      String tenantName,
      String period) {
    String token = UUID.randomUUID().toString().replace("-", "");
    String tokenHash = hashToken(token);
    String provider = getBillingMode();
    SubscriptionPaymentRequest payment = new SubscriptionPaymentRequest();
    payment.setId(UUID.randomUUID().toString());
    payment.setTenantId(tenantId);
    payment.setSubscriptionId(subscriptionId);
    payment.setEmail(email);
    payment.setStatus("pending");
    payment.setProvider(provider);
    payment.setTokenHash(tokenHash);
    payment.setAmountEur(BigDecimal.valueOf(amountEur));
    payment.setExpiresAt(getPaymentExpiresAt());
    payment.setCreatedAt(LocalDateTime.now());
    payment.setUpdatedAt(LocalDateTime.now());
    paymentRepository.save(payment);

    String paymentUrl =
        System.getenv("FRONTEND_BASE_URL") + "/billing/confirm?token=" + token;

    if ("stripe".equals(provider)) {
      Session session =
          createStripeCheckoutSession(tenantName, email, period, amountEur - servicesTotal(services), services, payment.getId());
      payment.setProviderRef(session.getId());
      paymentRepository.save(payment);
      if (session.getUrl() != null) {
        paymentUrl = session.getUrl();
      }
    }

    emailService.sendSubscriptionPaymentEmail(email, paymentUrl, tenantName, amountEur);
    return payment;
  }

  private double servicesTotal(List<ServiceSummary> services) {
    return services.stream().map(item -> item.priceEur).reduce(0d, Double::sum);
  }

  public Map<String, Object> getByTenantId(String tenantId) {
    var tenant = tenantsService.getById(tenantId);
    if (tenant == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found");
    }
    Optional<Subscription> subscription = subscriptionRepository.findByTenantId(tenantId);
    return buildResponse(subscription.orElse(null));
  }

  public Map<String, Object> create(String tenantId, CreateSubscriptionRequest dto) {
    var tenant = tenantsService.getById(tenantId);
    if (tenant == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found");
    }
    if (tenant.getBillingEmail() == null || tenant.getBillingEmail().isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tenant billing email required");
    }

    Optional<Subscription> existingOpt = subscriptionRepository.findByTenantId(tenantId);
    if (existingOpt.isPresent() && !"cancelled".equals(existingOpt.get().getStatus())) {
      return update(
          tenantId,
          new UpdateSubscriptionRequest(dto.period, dto.basePriceEur, dto.serviceCodes, null, dto.cancelAtPeriodEnd));
    }

    Set<String> codes = dto.serviceCodes != null ? Set.copyOf(dto.serviceCodes) : Set.of();
    if (!codes.isEmpty()) {
      List<ServiceCatalog> catalog = catalogRepository.findAllByCodeIn(List.copyOf(codes));
      if (catalog.size() != codes.size()) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "One or more services not found");
      }
    }

    LocalDateTime now = LocalDateTime.now();
    Subscription subscription;
    if (existingOpt.isPresent()) {
      Subscription existing = existingOpt.get();
      existing.setStatus("pending");
      existing.setPeriod(dto.period);
      existing.setBasePriceEur(dto.basePriceEur);
      existing.setCurrency("EUR");
      existing.setCurrentPeriodStart(now);
      existing.setCurrentPeriodEnd(buildPeriodEnd(now, dto.period));
      existing.setCancelAtPeriodEnd(false);
      existing.setUpdatedAt(LocalDateTime.now());
      subscription = subscriptionRepository.save(existing);
      subscriptionServiceRepository.deleteAll(
          subscriptionServiceRepository.findBySubscriptionId(existing.getId()));
    } else {
      Subscription created = new Subscription();
      created.setId(UUID.randomUUID().toString());
      created.setTenantId(tenantId);
      created.setStatus("pending");
      created.setPeriod(dto.period);
      created.setBasePriceEur(dto.basePriceEur);
      created.setCurrency("EUR");
      created.setCurrentPeriodStart(now);
      created.setCurrentPeriodEnd(buildPeriodEnd(now, dto.period));
      created.setCancelAtPeriodEnd(false);
      created.setCreatedAt(LocalDateTime.now());
      created.setUpdatedAt(LocalDateTime.now());
      subscription = subscriptionRepository.save(created);
    }

    if (!codes.isEmpty()) {
      List<ServiceCatalog> catalog = catalogRepository.findAllByCodeIn(List.copyOf(codes));
      List<SubscriptionService> rows = new ArrayList<>();
      for (ServiceCatalog service : catalog) {
        SubscriptionService entry = new SubscriptionService();
        entry.setId(UUID.randomUUID().toString());
        entry.setSubscriptionId(subscription.getId());
        entry.setServiceCode(service.getCode());
        entry.setStatus("pending");
        entry.setActivateAt(null);
        entry.setDeactivateAt(null);
        entry.setPriceEur(
            "annual".equals(dto.period) ? service.getPriceAnnualEur() : service.getPriceMonthlyEur());
        entry.setCreatedAt(LocalDateTime.now());
        entry.setUpdatedAt(LocalDateTime.now());
        rows.add(entry);
      }
      subscriptionServiceRepository.saveAll(rows);
    }

    List<ServiceSummary> servicesSummary =
        codes.isEmpty()
            ? List.of()
            : catalogRepository.findAllByCodeIn(List.copyOf(codes)).stream()
                .map(
                    service ->
                        new ServiceSummary(
                            service.getName(),
                            "annual".equals(dto.period)
                                ? service.getPriceAnnualEur().doubleValue()
                                : service.getPriceMonthlyEur().doubleValue()))
                .toList();
    double amountEur =
        dto.basePriceEur.doubleValue() + servicesTotal(servicesSummary);

    SubscriptionPaymentRequest payment =
        createPaymentRequest(
        tenantId,
        subscription.getId(),
        tenant.getBillingEmail(),
        amountEur,
        servicesSummary,
        tenant.getName(),
        dto.period);

    createInitialInvoice(payment, subscription);

    return buildResponse(subscription);
  }

  public Map<String, Object> update(String tenantId, UpdateSubscriptionRequest dto) {
    Subscription subscription =
        subscriptionRepository
            .findByTenantId(tenantId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription not found"));

    if (dto.period != null && !dto.period.equals(subscription.getPeriod())) {
      subscription.setPeriod(dto.period);
      subscription.setCurrentPeriodEnd(buildPeriodEnd(subscription.getCurrentPeriodStart(), dto.period));
    }
    if (dto.basePriceEur != null) {
      subscription.setBasePriceEur(dto.basePriceEur);
    }
    if (dto.status != null) {
      subscription.setStatus(dto.status);
    }
    if (dto.cancelAtPeriodEnd != null) {
      subscription.setCancelAtPeriodEnd(dto.cancelAtPeriodEnd);
    }
    subscription.setUpdatedAt(LocalDateTime.now());
    subscriptionRepository.save(subscription);

    LocalDateTime now = LocalDateTime.now();

    if (dto.removeServiceCodes != null && !dto.removeServiceCodes.isEmpty()) {
      Set<String> uniqueCodes = Set.copyOf(dto.removeServiceCodes);
      List<SubscriptionService> existingToRemove =
          subscriptionServiceRepository.findBySubscriptionId(subscription.getId()).stream()
              .filter(item -> uniqueCodes.contains(item.getServiceCode()))
              .toList();
      if (!existingToRemove.isEmpty()) {
        boolean shouldSchedule =
            "active".equals(subscription.getStatus()) && now.isBefore(subscription.getCurrentPeriodEnd());
        List<SubscriptionService> toDelete =
            existingToRemove.stream().filter(item -> "pending".equals(item.getStatus())).toList();
        List<SubscriptionService> toSchedule =
            existingToRemove.stream()
                .filter(item -> "active".equals(item.getStatus()) || "pending_removal".equals(item.getStatus()))
                .toList();
        if (!toDelete.isEmpty()) {
          subscriptionServiceRepository.deleteAll(toDelete);
        }
        if (!toSchedule.isEmpty()) {
          if (!shouldSchedule) {
            subscriptionServiceRepository.deleteAll(toSchedule);
          } else {
            toSchedule.forEach(item -> {
              item.setStatus("pending_removal");
              item.setDeactivateAt(subscription.getCurrentPeriodEnd());
              item.setUpdatedAt(LocalDateTime.now());
            });
            subscriptionServiceRepository.saveAll(toSchedule);
          }
        }
      }
    }

    if (dto.serviceCodes != null) {
      Set<String> codes = Set.copyOf(dto.serviceCodes);
      List<ServiceCatalog> catalog =
          codes.isEmpty() ? List.of() : catalogRepository.findAllByCodeIn(List.copyOf(codes));
      if (catalog.size() != codes.size()) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "One or more services not found");
      }

      List<SubscriptionService> existing = subscriptionServiceRepository.findBySubscriptionId(subscription.getId());
      Set<String> existingCodes =
          existing.stream().map(SubscriptionService::getServiceCode).collect(Collectors.toSet());

      List<SubscriptionService> toRestore =
          existing.stream()
              .filter(item -> "pending_removal".equals(item.getStatus()))
              .filter(item -> codes.contains(item.getServiceCode()))
              .toList();
      if (!toRestore.isEmpty()) {
        toRestore.forEach(item -> {
          item.setStatus("active");
          item.setDeactivateAt(null);
          item.setUpdatedAt(LocalDateTime.now());
        });
        subscriptionServiceRepository.saveAll(toRestore);
      }

      List<ServiceCatalog> toAdd = catalog.stream().filter(item -> !existingCodes.contains(item.getCode())).toList();
      if (!toAdd.isEmpty()) {
        List<SubscriptionService> rows = new ArrayList<>();
        for (ServiceCatalog service : toAdd) {
          boolean isPending =
              !"active".equals(subscription.getStatus())
                  || ("active".equals(subscription.getStatus()) && now.isBefore(subscription.getCurrentPeriodEnd()));
          SubscriptionService entry = new SubscriptionService();
          entry.setId(UUID.randomUUID().toString());
          entry.setSubscriptionId(subscription.getId());
          entry.setServiceCode(service.getCode());
          entry.setStatus(isPending ? "pending" : "active");
          entry.setActivateAt(isPending ? subscription.getCurrentPeriodEnd() : null);
          entry.setDeactivateAt(null);
          entry.setPriceEur(
              "annual".equals(subscription.getPeriod())
                  ? service.getPriceAnnualEur()
                  : service.getPriceMonthlyEur());
          entry.setCreatedAt(LocalDateTime.now());
          entry.setUpdatedAt(LocalDateTime.now());
          rows.add(entry);
        }
        subscriptionServiceRepository.saveAll(rows);
      }
    }

    syncLatestInvoice(subscription);

    if ("cancelled".equals(dto.status)) {
      createHistoryFromSubscription(subscription);
    }

    return buildResponse(subscription);
  }

  private void syncLatestInvoice(Subscription subscription) {
    if (subscription == null) {
      return;
    }
    List<TenantInvoice> invoices = invoiceRepository.findBySubscriptionId(subscription.getId());
    if (invoices.isEmpty()) {
      return;
    }
    TenantInvoice invoice =
        invoices.stream()
            .max(
                Comparator.comparing(
                    item -> item.getIssuedAt() != null ? item.getIssuedAt() : item.getCreatedAt()))
            .orElse(null);
    if (invoice == null) {
      return;
    }

    List<SubscriptionService> services =
        subscriptionServiceRepository.findBySubscriptionId(subscription.getId());
    double servicesTotal =
        services.stream().map(item -> item.getPriceEur().doubleValue()).reduce(0d, Double::sum);

    invoice.setBasePriceEur(subscription.getBasePriceEur());
    invoice.setServicesPriceEur(BigDecimal.valueOf(servicesTotal));
    invoice.setTotalEur(subscription.getBasePriceEur().add(BigDecimal.valueOf(servicesTotal)));
    invoiceRepository.save(invoice);

    List<TenantInvoiceItem> existingItems = invoiceItemRepository.findByInvoiceId(invoice.getId());
    Map<String, TenantInvoiceItem> itemMap =
        existingItems.stream()
            .collect(Collectors.toMap(TenantInvoiceItem::getServiceCode, item -> item, (a, b) -> a));
    List<TenantInvoiceItem> toSave = new ArrayList<>();
    LocalDateTime now = LocalDateTime.now();
    for (SubscriptionService service : services) {
      TenantInvoiceItem item = itemMap.get(service.getServiceCode());
      if (item == null) {
        TenantInvoiceItem created = new TenantInvoiceItem();
        created.setId(UUID.randomUUID().toString());
        created.setInvoiceId(invoice.getId());
        created.setServiceCode(service.getServiceCode());
        created.setDescription("Servicio " + service.getServiceCode());
        created.setPriceEur(service.getPriceEur());
        created.setStatus(service.getStatus());
        created.setCreatedAt(now);
        toSave.add(created);
      } else {
        item.setPriceEur(service.getPriceEur());
        item.setStatus(service.getStatus());
        toSave.add(item);
      }
    }
    if (!toSave.isEmpty()) {
      invoiceItemRepository.saveAll(toSave);
    }
  }

  @Transactional
  public Map<String, Object> deleteByTenantId(String tenantId) {
    var tenant = tenantsService.getById(tenantId);
    if (tenant == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant not found");
    }

    Optional<Subscription> subscriptionOpt = subscriptionRepository.findByTenantId(tenantId);

    if (subscriptionOpt.isPresent()) {
      Subscription subscription = subscriptionOpt.get();
      try {
        List<TenantInvoice> invoices = invoiceRepository.findBySubscriptionId(subscription.getId());
        if (!invoices.isEmpty()) {
          List<String> invoiceIds = invoices.stream().map(TenantInvoice::getId).toList();
          if (!invoiceIds.isEmpty()) {
            invoiceItemRepository.deleteByInvoiceIdIn(invoiceIds);
          }
          invoiceRepository.deleteAll(invoices);
        }
      } catch (DataAccessException ex) {
        // Tables may not exist yet in some environments; ignore invoice cleanup in that case.
      }

      try {
        paymentRepository.deleteBySubscriptionId(subscription.getId());
      } catch (DataAccessException ex) {
        // Ignore missing/legacy columns in payment requests during cleanup.
      }

      try {
        subscriptionHistoryRepository.deleteBySubscriptionId(subscription.getId());
      } catch (DataAccessException ex) {
        // Ignore missing/legacy columns in history during cleanup.
      }

      subscriptionServiceRepository.deleteBySubscriptionId(subscription.getId());
      subscriptionRepository.delete(subscription);
    } else {
      try {
        paymentRepository.deleteByTenantId(tenantId);
      } catch (DataAccessException ex) {
        // Ignore missing/legacy columns in payment requests during cleanup.
      }

      try {
        subscriptionHistoryRepository.deleteByTenantId(tenantId);
      } catch (DataAccessException ex) {
        // Ignore missing/legacy columns in history during cleanup.
      }
    }

    return buildResponse(null);
  }

  private void createHistoryFromSubscription(Subscription subscription) {
    boolean exists =
        subscriptionHistoryRepository.findBySubscriptionIdAndStartedAt(
                subscription.getId(), subscription.getCurrentPeriodStart())
            .isPresent();
    if (exists) {
      return;
    }
    List<SubscriptionService> services =
        subscriptionServiceRepository.findBySubscriptionId(subscription.getId()).stream()
            .filter(item -> List.of("active", "pending_removal").contains(item.getStatus()))
            .toList();
    double servicesTotal = services.stream().map(item -> item.getPriceEur().doubleValue()).reduce(0d, Double::sum);
    double basePrice = subscription.getBasePriceEur().doubleValue();
    LocalDateTime endDate =
        subscription.isCancelAtPeriodEnd() ? subscription.getCurrentPeriodEnd() : LocalDateTime.now();
    int periods = countPeriods(subscription.getCurrentPeriodStart(), endDate, subscription.getPeriod());
    double totalBilled = periods * (basePrice + servicesTotal);

    SubscriptionHistory history = new SubscriptionHistory();
    history.setId(UUID.randomUUID().toString());
    history.setTenantId(subscription.getTenantId());
    history.setSubscriptionId(subscription.getId());
    history.setPeriod(subscription.getPeriod());
    history.setBasePriceEur(BigDecimal.valueOf(basePrice));
    history.setServicesPriceEur(BigDecimal.valueOf(servicesTotal));
    history.setTotalBilledEur(BigDecimal.valueOf(totalBilled));
    history.setStartedAt(subscription.getCurrentPeriodStart());
    history.setEndedAt(endDate);
    history.setCreatedAt(LocalDateTime.now());
    subscriptionHistoryRepository.save(history);
  }

  public Map<String, Object> confirmPaymentByToken(String token) {
    String tokenHash = hashToken(token);
    SubscriptionPaymentRequest request =
        paymentRepository.findByTokenHashAndStatus(tokenHash, "pending").orElse(null);
    if (request == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment request not found");
    }
    if (request.getExpiresAt().isBefore(LocalDateTime.now())) {
      request.setStatus("expired");
      paymentRepository.save(request);
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment request expired");
    }
    return activateSubscription(request);
  }

  public Map<String, Object> confirmStripeSession(String sessionId) {
    String secret = System.getenv("STRIPE_SECRET_KEY");
    if (secret == null || secret.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe not configured");
    }
    Stripe.apiKey = secret;
    try {
      Session session = Session.retrieve(sessionId);
      if (!"paid".equals(session.getPaymentStatus())) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment not completed");
      }
      String paymentRequestId =
          session.getMetadata() != null ? session.getMetadata().get("paymentRequestId") : null;
      if (paymentRequestId == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment request metadata missing");
      }
      SubscriptionPaymentRequest request =
          paymentRepository.findById(paymentRequestId).orElseThrow(
              () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment request not found"));
      if (!"pending".equals(request.getStatus())) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment request not found");
      }
      return activateSubscription(request);
    } catch (ResponseStatusException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stripe session failed");
    }
  }

  public Map<String, Object> approvePaymentByAdmin(String tenantId) {
    SubscriptionPaymentRequest request =
        paymentRepository.findFirstByTenantIdAndStatusOrderByCreatedAtDesc(tenantId, "pending")
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No pending payment requests"));
    return activateSubscription(request);
  }

  private Map<String, Object> activateSubscription(SubscriptionPaymentRequest request) {
    request.setStatus("completed");
    request.setCompletedAt(LocalDateTime.now());
    request.setUpdatedAt(LocalDateTime.now());
    paymentRepository.save(request);

    Subscription subscription =
        subscriptionRepository
            .findById(request.getSubscriptionId())
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Subscription not found"));
    LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
    subscription.setStatus("active");
    subscription.setCurrentPeriodStart(now);
    subscription.setCurrentPeriodEnd(buildPeriodEnd(now, subscription.getPeriod()));
    subscription.setCancelAtPeriodEnd(false);
    subscription.setUpdatedAt(LocalDateTime.now());
    subscriptionRepository.save(subscription);

    List<SubscriptionService> pending =
        subscriptionServiceRepository.findBySubscriptionId(subscription.getId()).stream()
            .filter(item -> "pending".equals(item.getStatus()))
            .toList();
    if (!pending.isEmpty()) {
      pending.forEach(item -> {
        item.setStatus("active");
        item.setActivateAt(null);
        item.setUpdatedAt(LocalDateTime.now());
      });
      subscriptionServiceRepository.saveAll(pending);
    }

    createInvoiceFromPayment(request, subscription);

    return buildResponse(subscription);
  }

  private void createInvoiceFromPayment(SubscriptionPaymentRequest request, Subscription subscription) {
    if (request == null || subscription == null) {
      return;
    }
    Optional<TenantInvoice> existingInvoice =
        invoiceRepository.findFirstByPaymentRequestId(request.getId());

    List<SubscriptionService> services =
        subscriptionServiceRepository.findBySubscriptionId(subscription.getId()).stream()
            .filter(item -> List.of("active", "pending_removal").contains(item.getStatus()))
            .toList();
    double servicesTotal =
        services.stream().map(item -> item.getPriceEur().doubleValue()).reduce(0d, Double::sum);
    LocalDateTime now = LocalDateTime.now();

    TenantInvoice invoice;
    if (existingInvoice.isPresent()) {
      invoice = existingInvoice.get();
      invoice.setBasePriceEur(subscription.getBasePriceEur());
      invoice.setServicesPriceEur(BigDecimal.valueOf(servicesTotal));
      invoice.setTotalEur(request.getAmountEur());
      invoice.setCurrency(subscription.getCurrency() != null ? subscription.getCurrency() : "EUR");
      invoice.setStatus("paid");
      invoice.setPaidAt(now);
      invoice.setPeriodStart(subscription.getCurrentPeriodStart());
      invoice.setPeriodEnd(subscription.getCurrentPeriodEnd());
      invoiceRepository.save(invoice);
    } else {
      invoice = new TenantInvoice();
      invoice.setId(UUID.randomUUID().toString());
      invoice.setTenantId(request.getTenantId());
      invoice.setSubscriptionId(subscription.getId());
      invoice.setPaymentRequestId(request.getId());
      invoice.setPeriod(subscription.getPeriod());
      invoice.setBasePriceEur(subscription.getBasePriceEur());
      invoice.setServicesPriceEur(BigDecimal.valueOf(servicesTotal));
      invoice.setTotalEur(request.getAmountEur());
      invoice.setCurrency(subscription.getCurrency() != null ? subscription.getCurrency() : "EUR");
      invoice.setStatus("paid");
      invoice.setIssuedAt(now);
      invoice.setPaidAt(now);
      invoice.setPeriodStart(subscription.getCurrentPeriodStart());
      invoice.setPeriodEnd(subscription.getCurrentPeriodEnd());
      invoice.setCreatedAt(now);
      invoiceRepository.save(invoice);
    }

    List<TenantInvoiceItem> existingItems = invoiceItemRepository.findByInvoiceId(invoice.getId());
    if (existingItems.isEmpty()) {
      List<TenantInvoiceItem> items =
          services.stream()
              .map(
                  service -> {
                    TenantInvoiceItem item = new TenantInvoiceItem();
                    item.setId(UUID.randomUUID().toString());
                    item.setInvoiceId(invoice.getId());
                    item.setServiceCode(service.getServiceCode());
                    item.setDescription("Servicio " + service.getServiceCode());
                    item.setPriceEur(service.getPriceEur());
                    item.setStatus(service.getStatus());
                    item.setCreatedAt(now);
                    return item;
                  })
              .toList();
      if (!items.isEmpty()) {
        invoiceItemRepository.saveAll(items);
      }
    }
  }

  private void createInitialInvoice(SubscriptionPaymentRequest request, Subscription subscription) {
    if (request == null || subscription == null) {
      return;
    }
    if (invoiceRepository.findFirstByPaymentRequestId(request.getId()).isPresent()) {
      return;
    }

    List<SubscriptionService> services =
        subscriptionServiceRepository.findBySubscriptionId(subscription.getId());
    double servicesTotal =
        services.stream().map(item -> item.getPriceEur().doubleValue()).reduce(0d, Double::sum);
    LocalDateTime now = LocalDateTime.now();

    TenantInvoice invoice = new TenantInvoice();
    invoice.setId(UUID.randomUUID().toString());
    invoice.setTenantId(request.getTenantId());
    invoice.setSubscriptionId(subscription.getId());
    invoice.setPaymentRequestId(request.getId());
    invoice.setPeriod(subscription.getPeriod());
    invoice.setBasePriceEur(subscription.getBasePriceEur());
    invoice.setServicesPriceEur(BigDecimal.valueOf(servicesTotal));
    invoice.setTotalEur(request.getAmountEur());
    invoice.setCurrency(subscription.getCurrency() != null ? subscription.getCurrency() : "EUR");
    invoice.setStatus("pending");
    invoice.setIssuedAt(now);
    invoice.setPaidAt(null);
    invoice.setPeriodStart(subscription.getCurrentPeriodStart());
    invoice.setPeriodEnd(subscription.getCurrentPeriodEnd());
    invoice.setCreatedAt(now);
    invoiceRepository.save(invoice);

    List<TenantInvoiceItem> items =
        services.stream()
            .map(
                service -> {
                  TenantInvoiceItem item = new TenantInvoiceItem();
                  item.setId(UUID.randomUUID().toString());
                  item.setInvoiceId(invoice.getId());
                  item.setServiceCode(service.getServiceCode());
                  item.setDescription("Servicio " + service.getServiceCode());
                  item.setPriceEur(service.getPriceEur());
                  item.setStatus(service.getStatus());
                  item.setCreatedAt(now);
                  return item;
                })
            .toList();
    if (!items.isEmpty()) {
      invoiceItemRepository.saveAll(items);
    }
  }

  public List<Map<String, Object>> listAdminSummary() {
    List<Subscription> subscriptions = subscriptionRepository.findAll();
    List<SubscriptionService> services = subscriptionServiceRepository.findAll();
    List<SubscriptionHistory> histories = subscriptionHistoryRepository.findAll();
    Map<String, Subscription> subscriptionMap =
        subscriptions.stream().collect(Collectors.toMap(Subscription::getTenantId, item -> item, (a, b) -> a));
    Map<String, List<SubscriptionService>> servicesBySub = new HashMap<>();
    services.forEach(
        item -> servicesBySub.computeIfAbsent(item.getSubscriptionId(), key -> new ArrayList<>()).add(item));
    Map<String, Double> historyTotals = new HashMap<>();
    histories.forEach(
        entry ->
            historyTotals.put(
                entry.getTenantId(),
                historyTotals.getOrDefault(entry.getTenantId(), 0d)
                    + entry.getTotalBilledEur().doubleValue()));

    LocalDateTime now = LocalDateTime.now();
    return tenantsService.list(null).stream()
        .map(
            tenant -> {
              Subscription subscription = subscriptionMap.get(tenant.getId());
              if (subscription == null) {
                Map<String, Object> summary = new HashMap<>();
                summary.put("tenantId", tenant.getId());
                summary.put("tenantName", tenant.getName());
                summary.put("subscription", null);
                summary.put("currentTotalEur", 0);
                summary.put("billedSinceStartEur", 0);
                summary.put("historyTotalEur", historyTotals.getOrDefault(tenant.getId(), 0d));
                return summary;
              }
              List<SubscriptionService> serviceList = servicesBySub.getOrDefault(subscription.getId(), List.of());
              double servicesTotal =
                  serviceList.stream()
                      .filter(item -> "active".equals(item.getStatus()))
                      .map(item -> item.getPriceEur().doubleValue())
                      .reduce(0d, Double::sum);
              double basePrice = subscription.getBasePriceEur().doubleValue();
              LocalDateTime endDate =
                  "cancelled".equals(subscription.getStatus())
                      ? subscription.getCurrentPeriodEnd()
                      : now;
              int periods =
                  countPeriods(subscription.getCurrentPeriodStart(), endDate, subscription.getPeriod());
              double currentTotal = basePrice + servicesTotal;

              Map<String, Object> summary = new HashMap<>();
              summary.put("tenantId", tenant.getId());
              summary.put("tenantName", tenant.getName());
              summary.put("subscription", subscription);
              summary.put("currentTotalEur", currentTotal);
              summary.put("billedSinceStartEur", periods * currentTotal);
              summary.put("historyTotalEur", historyTotals.getOrDefault(tenant.getId(), 0d));
              return summary;
            })
        .toList();
  }

  public static class CreateSubscriptionRequest {
    public String period;
    public BigDecimal basePriceEur;
    public List<String> serviceCodes;
    public Boolean cancelAtPeriodEnd;
  }

  public static class UpdateSubscriptionRequest {
    public String period;
    public BigDecimal basePriceEur;
    public List<String> serviceCodes;
    public List<String> removeServiceCodes;
    public String status;
    public Boolean cancelAtPeriodEnd;

    public UpdateSubscriptionRequest() {}

    public UpdateSubscriptionRequest(
        String period,
        BigDecimal basePriceEur,
        List<String> serviceCodes,
        List<String> removeServiceCodes,
        Boolean cancelAtPeriodEnd) {
      this.period = period;
      this.basePriceEur = basePriceEur;
      this.serviceCodes = serviceCodes;
      this.removeServiceCodes = removeServiceCodes;
      this.cancelAtPeriodEnd = cancelAtPeriodEnd;
    }
  }

  private record ServiceSummary(String name, double priceEur) {}
}
