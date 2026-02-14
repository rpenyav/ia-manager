package com.neria.manager.chat;

import com.neria.manager.common.entities.ChatConversation;
import com.neria.manager.common.entities.ChatMessage;
import com.neria.manager.common.entities.ChatUser;
import com.neria.manager.common.entities.TenantServiceConfig;
import com.neria.manager.common.repos.ChatConversationRepository;
import com.neria.manager.common.repos.ChatMessageRepository;
import com.neria.manager.common.repos.ChatUserRepository;
import com.neria.manager.runtime.ExecuteRequest;
import com.neria.manager.runtime.RuntimeService;
import com.neria.manager.tenantservices.TenantServicesService;
import com.neria.manager.tenantservices.TenantServicesService.TenantServiceEndpointResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.UUID;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ChatService {
  private static final Logger log = LoggerFactory.getLogger(ChatService.class);
  private final ChatConversationRepository conversationsRepository;
  private final ChatMessageRepository messagesRepository;
  private final ChatUserRepository usersRepository;
  private final RuntimeService runtimeService;
  private final ChatAuthService chatAuthService;
  private final TenantServicesService tenantServicesService;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public ChatService(
      ChatConversationRepository conversationsRepository,
      ChatMessageRepository messagesRepository,
      ChatUserRepository usersRepository,
      RuntimeService runtimeService,
      ChatAuthService chatAuthService,
      TenantServicesService tenantServicesService,
      ObjectMapper objectMapper) {
    this.conversationsRepository = conversationsRepository;
    this.messagesRepository = messagesRepository;
    this.usersRepository = usersRepository;
    this.runtimeService = runtimeService;
    this.chatAuthService = chatAuthService;
    this.tenantServicesService = tenantServicesService;
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
  }

  public List<ChatConversation> listConversations(String tenantId, String userId) {
    return conversationsRepository.findByTenantIdAndUserIdOrderByUpdatedAtDesc(tenantId, userId);
  }

  public List<TenantServicesService.TenantServiceUserService> listUserServices(
      String tenantId, String userId) {
    return tenantServicesService.listServicesForUser(tenantId, userId);
  }

  public List<TenantServicesService.TenantServiceEndpointResponse> listServiceEndpoints(
      String tenantId, String userId, String serviceCode) {
    return tenantServicesService.listEndpointsForUser(tenantId, serviceCode, userId);
  }

  public ChatConversation createConversation(
      String tenantId, String userId, String apiKeyId, CreateConversationRequest dto) {
    String serviceCode = dto.serviceCode.trim();
    tenantServicesService.requireServiceAccess(tenantId, serviceCode, userId);

    ChatConversation conversation = new ChatConversation();
    conversation.setId(UUID.randomUUID().toString());
    conversation.setTenantId(tenantId);
    conversation.setUserId(userId);
    conversation.setServiceCode(serviceCode);
    conversation.setProviderId(dto.providerId);
    conversation.setModel(dto.model);
    conversation.setTitle(dto.title != null ? dto.title.trim() : null);
    conversation.setApiKeyId(apiKeyId);
    conversation.setCreatedAt(LocalDateTime.now());
    conversation.setUpdatedAt(LocalDateTime.now());
    ChatConversation saved = conversationsRepository.save(conversation);

    String prompt =
        dto.systemPrompt != null ? dto.systemPrompt.trim() : "";
    var access = tenantServicesService.requireServiceAccess(tenantId, serviceCode, userId);
    if (access != null && access.config != null && access.config.getSystemPrompt() != null) {
      prompt = access.config.getSystemPrompt().trim();
    }
    if (!prompt.isBlank()) {
      ChatMessage systemMessage = new ChatMessage();
      systemMessage.setId(UUID.randomUUID().toString());
      systemMessage.setTenantId(tenantId);
      systemMessage.setConversationId(saved.getId());
      systemMessage.setUserId(userId);
      systemMessage.setRole("system");
      systemMessage.setContent(prompt);
      systemMessage.setTokensIn(0);
      systemMessage.setTokensOut(0);
      systemMessage.setCreatedAt(LocalDateTime.now());
      messagesRepository.save(systemMessage);
    }
    return saved;
  }

  public ChatConversation getConversation(String tenantId, String id) {
    return conversationsRepository
        .findByIdAndTenantId(id, tenantId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
  }

  public List<ChatMessage> listMessages(String tenantId, String conversationId) {
    return messagesRepository.findByTenantIdAndConversationIdOrderByCreatedAtAsc(tenantId, conversationId);
  }

  public List<ChatMessage> listMessagesForUser(String tenantId, String userId, String conversationId) {
    ChatConversation conversation = getConversation(tenantId, conversationId);
    if (!conversation.getUserId().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation does not belong to user");
    }
    return listMessages(tenantId, conversationId);
  }

  private AddMessageResult addMessageInternal(
      String tenantId,
      String userId,
      String apiKeyId,
      String conversationId,
      CreateMessageRequest dto) {
    ChatConversation conversation = getConversation(tenantId, conversationId);
    if (!conversation.getUserId().equals(userId)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Conversation does not belong to user");
    }
    tenantServicesService.requireServiceAccess(tenantId, conversation.getServiceCode(), userId);

    ChatUser user =
        usersRepository
            .findByIdAndTenantId(userId, tenantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "User disabled"));
    if (!"active".equals(user.getStatus())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User disabled");
    }

    ChatMessage userMessage = new ChatMessage();
    userMessage.setId(UUID.randomUUID().toString());
    userMessage.setTenantId(tenantId);
    userMessage.setConversationId(conversationId);
    userMessage.setUserId(userId);
    userMessage.setRole("user");
    userMessage.setContent(dto.content);
    userMessage.setTokensIn(0);
    userMessage.setTokensOut(0);
    userMessage.setCreatedAt(LocalDateTime.now());
    messagesRepository.save(userMessage);

    List<ChatMessage> history =
        messagesRepository.findTop20ByTenantIdAndConversationIdOrderByCreatedAtDesc(tenantId, conversationId);
    history = history.stream().sorted(Comparator.comparing(ChatMessage::getCreatedAt)).toList();
    String searchMessage = dto.content;
    String previousUserMessage = null;
    for (int i = history.size() - 1; i >= 0; i--) {
      ChatMessage message = history.get(i);
      if (!"user".equalsIgnoreCase(message.getRole())) {
        continue;
      }
      if (userMessage.getId().equals(message.getId())) {
        continue;
      }
      previousUserMessage = message.getContent();
      break;
    }
    if (previousUserMessage != null) {
      boolean hasYear = extractYear(searchMessage) != null;
      List<String> currentKeywords = extractMessageKeywords(searchMessage);
      if (!hasYear || currentKeywords.size() <= 1) {
        searchMessage = previousUserMessage + " " + searchMessage;
      }
    }
    TenantServiceConfig serviceConfig =
        tenantServicesService.getConfig(tenantId, conversation.getServiceCode());
    List<String> scopeKeywords =
        extractScopeKeywords(serviceConfig != null ? serviceConfig.getSystemPrompt() : null);
    String outOfScopeResponse =
        extractOutOfScopeResponse(serviceConfig != null ? serviceConfig.getSystemPrompt() : null);
    boolean scopeBlocked =
        !scopeKeywords.isEmpty() && isOutOfScope(searchMessage, scopeKeywords);
    List<TenantServiceEndpointResponse> endpoints =
        tenantServicesService.listEndpointsForUser(tenantId, conversation.getServiceCode(), userId).stream()
            .filter(item -> item.enabled)
            .toList();
    if (scopeBlocked && endpoints.isEmpty()) {
      log.warn(
          "Chat out-of-scope blocked tenant={} service={} user={} keywords={} message={} search={}",
          tenantId,
          conversation.getServiceCode(),
          userId,
          scopeKeywords,
          dto.content,
          searchMessage);
      String refusal =
          outOfScopeResponse != null && !outOfScopeResponse.isBlank()
              ? outOfScopeResponse
              : "No tengo información para responder a esa pregunta.";

      ChatMessage assistantMessage = new ChatMessage();
      assistantMessage.setId(UUID.randomUUID().toString());
      assistantMessage.setTenantId(tenantId);
      assistantMessage.setConversationId(conversationId);
      assistantMessage.setUserId(userId);
      assistantMessage.setRole("assistant");
      assistantMessage.setContent(refusal);
      assistantMessage.setTokensIn(0);
      assistantMessage.setTokensOut(0);
      assistantMessage.setCreatedAt(LocalDateTime.now());
      messagesRepository.save(assistantMessage);

      conversation.setUpdatedAt(LocalDateTime.now());
      if (conversation.getApiKeyId() == null && apiKeyId != null) {
        conversation.setApiKeyId(apiKeyId);
      }
      conversationsRepository.save(conversation);

      AddMessageResult result = new AddMessageResult();
      result.conversationId = conversationId;
      result.message = assistantMessage;
      result.output = Map.of("outOfScope", true);
      return result;
    }
    if (endpoints.isEmpty()) {
      log.warn(
          "Chat no endpoints tenant={} service={} user={}",
          tenantId,
          conversation.getServiceCode(),
          userId);
    }

    EndpointContext endpointContext = buildEndpointContext(
        serviceConfig, endpoints, searchMessage);
    if (endpointContext.refuse) {
      String refusal =
          endpointContext.suggestion != null && !endpointContext.suggestion.isBlank()
              ? endpointContext.suggestion
              : (outOfScopeResponse != null && !outOfScopeResponse.isBlank()
                  ? outOfScopeResponse
                  : "No tengo información para responder a esa pregunta.");

      ChatMessage assistantMessage = new ChatMessage();
      assistantMessage.setId(UUID.randomUUID().toString());
      assistantMessage.setTenantId(tenantId);
      assistantMessage.setConversationId(conversationId);
      assistantMessage.setUserId(userId);
      assistantMessage.setRole("assistant");
      assistantMessage.setContent(refusal);
      assistantMessage.setTokensIn(0);
      assistantMessage.setTokensOut(0);
      assistantMessage.setCreatedAt(LocalDateTime.now());
      messagesRepository.save(assistantMessage);

      conversation.setUpdatedAt(LocalDateTime.now());
      if (conversation.getApiKeyId() == null && apiKeyId != null) {
        conversation.setApiKeyId(apiKeyId);
      }
      conversationsRepository.save(conversation);

      AddMessageResult result = new AddMessageResult();
      result.conversationId = conversationId;
      result.message = assistantMessage;
      result.output = Map.of("outOfScope", true);
      return result;
    }

    String systemPrompt =
        buildSystemPrompt(serviceConfig, endpoints, conversation.getServiceCode());
    if (endpointContext.context != null && !endpointContext.context.isBlank()) {
      systemPrompt = systemPrompt + "\n\nENDPOINT_DATA:\n" + endpointContext.context;
      systemPrompt =
          systemPrompt
              + "\n\nREGLAS DE RESPUESTA:\n"
              + "- Responde directamente con los datos de ENDPOINT_DATA.\n"
              + "- No anuncies búsquedas ni pidas confirmación.\n"
              + "- Si faltan datos, indícalo de forma concisa y sugiere un criterio alternativo.";
    }
    boolean injectSystem = systemPrompt != null && !systemPrompt.isBlank();

    List<Map<String, String>> payloadMessages = new java.util.ArrayList<>();
    if (injectSystem) {
      payloadMessages.add(Map.of("role", "system", "content", systemPrompt));
    }
    payloadMessages.addAll(
        history.stream()
            .filter(item -> !injectSystem || !"system".equalsIgnoreCase(item.getRole()))
            .map(item -> Map.of("role", item.getRole(), "content", item.getContent()))
            .toList());

    ExecuteRequest runtimeRequest = new ExecuteRequest();
    runtimeRequest.providerId = conversation.getProviderId();
    runtimeRequest.model = conversation.getModel();
    runtimeRequest.payload = Map.of("messages", payloadMessages);
    runtimeRequest.serviceCode = conversation.getServiceCode();
    var runtimeResponse = runtimeService.execute(tenantId, runtimeRequest);

    Object output = runtimeResponse.get("output");
    String assistantContent = extractAssistantContent(output);
    int tokensIn = extractTokens(output, "prompt_tokens", "input_tokens");
    int tokensOut = extractTokens(output, "completion_tokens", "output_tokens");

    ChatMessage assistantMessage = new ChatMessage();
    assistantMessage.setId(UUID.randomUUID().toString());
    assistantMessage.setTenantId(tenantId);
    assistantMessage.setConversationId(conversationId);
    assistantMessage.setUserId(userId);
    assistantMessage.setRole("assistant");
    assistantMessage.setContent(assistantContent);
    assistantMessage.setTokensIn(tokensIn);
    assistantMessage.setTokensOut(tokensOut);
    assistantMessage.setCreatedAt(LocalDateTime.now());
    messagesRepository.save(assistantMessage);

    conversation.setUpdatedAt(LocalDateTime.now());
    if (conversation.getApiKeyId() == null && apiKeyId != null) {
      conversation.setApiKeyId(apiKeyId);
    }
    conversationsRepository.save(conversation);

    AddMessageResult result = new AddMessageResult();
    result.conversationId = conversationId;
    result.message = assistantMessage;
    result.output = output;
    return result;
  }

  public Map<String, Object> addMessage(
      String tenantId,
      String userId,
      String apiKeyId,
      String conversationId,
      CreateMessageRequest dto) {
    AddMessageResult result = addMessageInternal(tenantId, userId, apiKeyId, conversationId, dto);
    return Map.of(
        "conversationId", result.conversationId,
        "message", result.message,
        "output", result.output);
  }

  public AddMessageResult addMessageForStreaming(
      String tenantId,
      String userId,
      String apiKeyId,
      String conversationId,
      CreateMessageRequest dto) {
    return addMessageInternal(tenantId, userId, apiKeyId, conversationId, dto);
  }

  public List<ChatConversation> adminListConversations(String tenantId) {
    return conversationsRepository.findByTenantIdOrderByUpdatedAtDesc(tenantId);
  }

  public List<ChatMessage> adminListMessages(String tenantId, String conversationId) {
    ChatConversation conversation = getConversation(tenantId, conversationId);
    return listMessages(tenantId, conversation.getId());
  }

  public Map<String, Object> adminDeleteConversation(String tenantId, String id) {
    ChatConversation conversation = getConversation(tenantId, id);
    messagesRepository.deleteByTenantIdAndConversationId(tenantId, conversation.getId());
    conversationsRepository.deleteById(conversation.getId());
    return Map.of("deleted", true);
  }

  public List<Map<String, Object>> adminListUsers(String tenantId) {
    return usersRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
        .map(this::toUserView)
        .toList();
  }

  public Map<String, Object> adminCreateUser(String tenantId, CreateChatUserRequest dto) {
    String email = dto.email == null ? "" : dto.email.trim().toLowerCase();
    usersRepository.findByTenantIdAndEmail(tenantId, email).ifPresent(existing -> {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email already registered");
    });
    ChatUser user = new ChatUser();
    user.setId(UUID.randomUUID().toString());
    user.setTenantId(tenantId);
    user.setEmail(email);
    user.setName(dto.name != null ? dto.name.trim() : null);
    user.setPasswordHash(chatAuthService.hashPassword(dto.password));
    user.setStatus("active");
    user.setCreatedAt(LocalDateTime.now());
    user.setUpdatedAt(LocalDateTime.now());
    ChatUser saved = usersRepository.save(user);
    return toUserView(saved);
  }

  public Map<String, Object> adminUpdateUser(String tenantId, String id, UpdateChatUserRequest dto) {
    ChatUser user =
        usersRepository
            .findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

    if (dto.email != null) {
      String normalized = dto.email.trim().toLowerCase();
      usersRepository.findByTenantIdAndEmail(tenantId, normalized).ifPresent(existing -> {
        if (!existing.getId().equals(user.getId())) {
          throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email already registered");
        }
      });
      user.setEmail(normalized);
    }
    if (dto.name != null) {
      user.setName(dto.name.trim());
    }
    if (dto.password != null && !dto.password.isBlank()) {
      user.setPasswordHash(chatAuthService.hashPassword(dto.password));
    }
    if (dto.status != null) {
      user.setStatus(dto.status);
    }
    user.setUpdatedAt(LocalDateTime.now());
    ChatUser saved = usersRepository.save(user);
    return toUserView(saved);
  }

  public Map<String, Object> adminDeleteUser(String tenantId, String id) {
    ChatUser user =
        usersRepository
            .findByIdAndTenantId(id, tenantId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    tenantServicesService.removeUserFromAllServices(tenantId, id);
    List<ChatConversation> conversations =
        conversationsRepository.findByTenantIdAndUserIdOrderByUpdatedAtDesc(tenantId, id);
    conversations.forEach(conv -> messagesRepository.deleteByTenantIdAndConversationId(tenantId, conv.getId()));
    conversationsRepository.deleteAll(conversations);
    usersRepository.delete(user);
    return Map.of("deleted", true);
  }

  private Map<String, Object> toUserView(ChatUser user) {
    return Map.of(
        "id",
        user.getId(),
        "tenantId",
        user.getTenantId(),
        "email",
        user.getEmail(),
        "name",
        user.getName(),
        "status",
        user.getStatus(),
        "createdAt",
        user.getCreatedAt(),
        "updatedAt",
        user.getUpdatedAt());
  }

  private String extractAssistantContent(Object output) {
    if (!(output instanceof Map)) {
      return String.valueOf(output);
    }
    Map<String, Object> parsed = (Map<String, Object>) output;
    Object choicesObj = parsed.get("choices");
    if (choicesObj instanceof List<?> choices && !choices.isEmpty()) {
      Object first = choices.get(0);
      if (first instanceof Map<?, ?> firstMap) {
        Object message = firstMap.get("message");
        if (message instanceof Map<?, ?> messageMap) {
          Object content = messageMap.get("content");
          if (content != null) {
            return String.valueOf(content);
          }
        }
        Object text = firstMap.get("text");
        if (text != null) {
          return String.valueOf(text);
        }
      }
    }
    Object response = parsed.get("response");
    return response != null ? String.valueOf(response) : String.valueOf(output);
  }

  private int extractTokens(Object output, String primaryKey, String fallbackKey) {
    if (!(output instanceof Map)) {
      return 0;
    }
    Map<String, Object> parsed = (Map<String, Object>) output;
    Object usageObj = parsed.get("usage");
    if (!(usageObj instanceof Map)) {
      return 0;
    }
    Map<String, Object> usage = (Map<String, Object>) usageObj;
    Object primary = usage.get(primaryKey);
    if (primary instanceof Number) {
      return ((Number) primary).intValue();
    }
    Object fallback = usage.get(fallbackKey);
    if (fallback instanceof Number) {
      return ((Number) fallback).intValue();
    }
    return 0;
  }

  public static class CreateConversationRequest {
    public String providerId;
    public String model;
    public String serviceCode;
    public String title;
    public String systemPrompt;
  }

  public static class CreateMessageRequest {
    public String content;
  }

  public static class CreateChatUserRequest {
    public String email;
    public String name;
    public String password;
  }

  public static class UpdateChatUserRequest {
    public String email;
    public String name;
    public String password;
    public String status;
  }

  public static class AddMessageResult {
    public String conversationId;
    public ChatMessage message;
    public Object output;
  }

  private String buildSystemPrompt(
      TenantServiceConfig config,
      List<TenantServiceEndpointResponse> endpoints,
      String serviceCode) {
    StringBuilder sb = new StringBuilder();
    if (config != null && config.getSystemPrompt() != null && !config.getSystemPrompt().isBlank()) {
      sb.append(config.getSystemPrompt().trim()).append("\n\n");
    }

    sb.append("Contexto del servicio: ").append(serviceCode).append(".\n");

    if (endpoints == null || endpoints.isEmpty()) {
      sb.append("No hay endpoints disponibles. Responde usando el contexto del chat.\n");
      sb.append(
          "Regla obligatoria: responde únicamente con información contenida en este prompt. ");
      sb.append(
          "Si la pregunta no está cubierta por este contexto, responde exactamente: ");
      sb.append("\"No tengo información para responder a esa pregunta.\"");
      return sb.toString().trim();
    }

    sb.append("Dispones de endpoints para consultar datos. ");
    sb.append("Si necesitas información externa, usa estos endpoints como fuente.\n");
    sb.append("ENDPOINTS:\n");
    for (TenantServiceEndpointResponse endpoint : endpoints) {
      if (!endpoint.enabled) {
        continue;
      }
      sb.append("- ")
          .append(endpoint.method != null ? endpoint.method : "GET")
          .append(" ")
          .append(endpoint.path != null ? endpoint.path : "")
          .append(" (slug=")
          .append(endpoint.slug != null ? endpoint.slug : "n/a")
          .append(", baseUrl=")
          .append(endpoint.baseUrl != null && !endpoint.baseUrl.isBlank()
              ? endpoint.baseUrl
              : (config != null ? config.getApiBaseUrl() : ""))
          .append(")");
      if (endpoint.headers != null && !endpoint.headers.isEmpty()) {
        String headers =
            endpoint.headers.entrySet().stream()
                .map(entry -> entry.getKey() + ":" + entry.getValue())
                .collect(Collectors.joining(", "));
        sb.append(" headers=[").append(headers).append("]");
      }
      sb.append("\n");
    }

    sb.append(
        "Instrucciones: Si la respuesta depende de datos externos, consulta primero el endpoint más relevante. ");
    sb.append(
        "Si no hay datos suficientes, responde exactamente: \"No tengo información para responder a esa pregunta.\"");
    return sb.toString().trim();
  }

  private EndpointContext buildEndpointContext(
      TenantServiceConfig config,
      List<TenantServiceEndpointResponse> endpoints,
      String userMessage) {
    EndpointContext context = new EndpointContext();
    if (endpoints == null || endpoints.isEmpty()) {
      return context;
    }
    Integer year = extractYear(userMessage);
    List<String> keywords = extractMessageKeywords(userMessage);
    List<TenantServiceEndpointResponse> orderedEndpoints =
        prioritizeEndpoints(endpoints, keywords);
    List<String> blocks = new ArrayList<>();
    boolean anyData = false;
    boolean anyMatches = false;
    java.util.Set<Integer> availableYears = new java.util.TreeSet<>();

    for (TenantServiceEndpointResponse endpoint : orderedEndpoints) {
      if (endpoint == null) {
        continue;
      }
      if (endpoint.method != null && !"GET".equalsIgnoreCase(endpoint.method)) {
        log.warn(
            "Endpoint skipped non-GET slug={} method={} path={} (solo GET soportado)",
            endpoint.slug,
            endpoint.method,
            endpoint.path);
        continue;
      }
      String path = endpoint.path != null ? endpoint.path.trim() : "";
      String url = null;
      if (path.startsWith("http://") || path.startsWith("https://")) {
        url = path;
      } else {
        String baseUrl =
            endpoint.baseUrl != null && !endpoint.baseUrl.isBlank()
                ? endpoint.baseUrl
                : (config != null ? config.getApiBaseUrl() : null);
        if (baseUrl == null || baseUrl.isBlank()) {
          log.warn(
              "Endpoint skipped missing baseUrl slug={} path={}",
              endpoint.slug,
              path);
          continue;
        }
        String base =
            baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String normalizedPath = path.startsWith("/") ? path : "/" + path;
        url = base + normalizedPath;
      }
      EndpointFetch fetch = fetchEndpoint(url, endpoint.headers);
      if (!fetch.ok) {
        log.info(
            "Endpoint fetch failed slug={} url={} responsePath={} status={} error={}",
            endpoint.slug,
            url,
            endpoint.responsePath,
            fetch.status,
            fetch.error);
        continue;
      }
      anyData = true;
      Object data = fetch.data;
      log.info(
          "Endpoint fetch ok slug={} url={} responsePath={} total={}",
          endpoint.slug,
          url,
          endpoint.responsePath,
          countItems(data, endpoint.responsePath));
      data = maybeLoadMorePages(url, endpoint.headers, data, endpoint.responsePath, year, keywords);
      if (year != null) {
        List<Object> items = extractItems(data, endpoint.responsePath);
        for (Object item : items) {
          Integer itemYear = extractYearFromItem(item);
          if (itemYear != null) {
            availableYears.add(itemYear);
          }
        }
      }
      Object filtered = filterEndpointData(data, endpoint.responsePath, year, keywords);
      int matchCount = countItems(filtered, endpoint.responsePath);
      log.info("Endpoint filtered slug={} matches={}", endpoint.slug, matchCount);
      if (matchCount > 0) {
        anyMatches = true;
      }

      try {
        String json = objectMapper.writeValueAsString(filtered);
        if (json.length() > 4000) {
          json = json.substring(0, 4000) + "...";
        }
        blocks.add(
            String.format(
                "slug=%s url=%s path=%s data=%s",
                endpoint.slug != null ? endpoint.slug : "n/a",
                url,
                endpoint.responsePath != null ? endpoint.responsePath : "",
                json));
      } catch (Exception ex) {
        // ignore
      }
    }

    context.context = String.join("\n", blocks);
    if (!anyData && !endpoints.isEmpty()) {
      context.refuse = true;
      context.suggestion =
          "No he podido acceder a la fuente de datos ahora mismo. Revisa la configuración del endpoint.";
      return context;
    }
    context.refuse = anyData && !anyMatches && (year != null || !keywords.isEmpty());
    if (context.refuse) {
      if (year != null && !availableYears.isEmpty()) {
        String years =
            availableYears.stream()
                .sorted()
                .limit(6)
                .map(String::valueOf)
                .collect(Collectors.joining(", "));
        context.suggestion =
            "No he encontrado resultados para el año "
                + year
                + ". Años disponibles: "
                + years
                + ".";
      } else {
        context.suggestion =
            "No he encontrado resultados para esa búsqueda. Puedes probar con otro año o criterio.";
      }
    }
    return context;
  }

  private EndpointFetch fetchEndpoint(String url, Map<String, String> headers) {
    EndpointFetch result = new EndpointFetch();
    try {
      HttpRequest.Builder builder =
          HttpRequest.newBuilder()
              .uri(URI.create(url))
              .timeout(Duration.ofSeconds(15))
              .GET();
      if (headers != null) {
        headers.forEach(builder::header);
      }
      HttpResponse<String> response =
          httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        result.status = response.statusCode();
        result.error = "HTTP " + response.statusCode();
        return result;
      }
      String body = response.body();
      if (body == null || body.isBlank()) {
        return result;
      }
      Object parsed = objectMapper.readValue(body, Object.class);
      result.ok = true;
      result.data = parsed;
      result.status = response.statusCode();
    } catch (Exception ex) {
      result.error = ex.getClass().getSimpleName();
      return result;
    }
    return result;
  }

  private List<TenantServiceEndpointResponse> prioritizeEndpoints(
      List<TenantServiceEndpointResponse> endpoints, List<String> keywords) {
    if (endpoints == null || endpoints.isEmpty() || keywords == null || keywords.isEmpty()) {
      return endpoints;
    }
    List<ScoredEndpoint> scored =
        endpoints.stream()
            .map(endpoint -> new ScoredEndpoint(endpoint, scoreEndpoint(endpoint, keywords)))
            .sorted((a, b) -> Integer.compare(b.score, a.score))
            .toList();
    int best = scored.stream().mapToInt(item -> item.score).max().orElse(0);
    if (best <= 0) {
      return endpoints;
    }
    return scored.stream().filter(item -> item.score > 0).map(item -> item.endpoint).toList();
  }

  private int scoreEndpoint(TenantServiceEndpointResponse endpoint, List<String> keywords) {
    if (endpoint == null || keywords == null || keywords.isEmpty()) {
      return 0;
    }
    String slug = endpoint.slug != null ? normalizeText(endpoint.slug) : "";
    String path = endpoint.path != null ? normalizeText(endpoint.path) : "";
    int score = 0;
    for (String keyword : keywords) {
      if (keyword == null || keyword.isBlank()) {
        continue;
      }
      String token = normalizeText(keyword);
      if (token.length() < 3) {
        continue;
      }
      if (!slug.isEmpty() && slug.contains(token)) {
        score += 3;
      }
      if (!path.isEmpty() && path.contains(token)) {
        score += 2;
      }
    }
    return score;
  }

  private Object maybeLoadMorePages(
      String baseUrl,
      Map<String, String> headers,
      Object data,
      String responsePath,
      Integer year,
      List<String> keywords) {
    if (!(data instanceof Map<?, ?> map)) {
      return data;
    }
    Object listCandidate = extractByPath(map, responsePath);
    if (!(listCandidate instanceof List<?>)) {
      listCandidate = map.get("list");
    }
    if (!(listCandidate instanceof List<?> list)) {
      return data;
    }
    int total = toInt(map.get("totalRegisters"));
    int pageSize = toInt(map.get("pageSize"));
    int pageNumber = toInt(map.get("pageNumber"));
    if (pageSize <= 0) {
      pageSize = list.size();
    }
    if (pageNumber <= 0) {
      pageNumber = 1;
    }
    if (total <= pageSize || pageSize <= 0) {
      return data;
    }

    List<Object> aggregated = new ArrayList<>();
    aggregated.addAll(list);

    int maxRecords = 5000;
    int targetTotal = total > 0 ? Math.min(total, maxRecords) : maxRecords;
    boolean needsSearch = (year != null) || (keywords != null && !keywords.isEmpty());
    if (!needsSearch) {
      return data;
    }

    int maxPages =
        total > 0
            ? (int) Math.ceil((double) targetTotal / (double) pageSize)
            : (int) Math.ceil((double) maxRecords / (double) pageSize);
    int currentPage = pageNumber;
    while (currentPage < maxPages && aggregated.size() < maxRecords) {
      currentPage += 1;
      String pagedUrl = withPageParams(baseUrl, currentPage, pageSize);
      EndpointFetch next = fetchEndpoint(pagedUrl, headers);
      if (!next.ok || !(next.data instanceof Map<?, ?> nextMap)) {
        break;
      }
      Object listObj = extractByPath(nextMap, responsePath);
      if (!(listObj instanceof List<?>)) {
        listObj = nextMap.get("list");
      }
      if (!(listObj instanceof List<?> nextList) || nextList.isEmpty()) {
        break;
      }
      aggregated.addAll(nextList);
      if (aggregated.size() >= maxRecords) {
        aggregated = aggregated.subList(0, maxRecords);
        break;
      }
    }

    Map<String, Object> copy = new HashMap<>();
    map.forEach((key, value) -> copy.put(String.valueOf(key), value));
    copy.put("list", aggregated);
    copy.put("totalRegisters", aggregated.size());
    copy.put("pageNumber", pageNumber);
    copy.put("pageSize", pageSize);
    return copy;
  }

  private boolean hasMatch(List<Object> items, Integer year, List<String> keywords) {
    if (items == null || items.isEmpty()) {
      return false;
    }
    return items.stream()
        .anyMatch(item -> {
          if (year != null) {
            Integer itemYear = extractYearFromItem(item);
            if (itemYear == null || !itemYear.equals(year)) {
              return false;
            }
          }
          if (keywords == null || keywords.isEmpty()) {
            return true;
          }
          String haystack = String.valueOf(item).toLowerCase();
          for (String keyword : keywords) {
            if (haystack.contains(keyword.toLowerCase())) {
              return true;
            }
          }
          return false;
        });
  }

  private String withPageParams(String url, int pageNumber, int pageSize) {
    String separator = url.contains("?") ? "&" : "?";
    return url + separator + "pageNumber=" + pageNumber + "&pageSize=" + pageSize;
  }

  private Object filterEndpointData(Object data, String responsePath, Integer year, List<String> keywords) {
    if (data == null) {
      return List.of();
    }
    if (data instanceof Map<?, ?> map) {
      Object extracted = extractByPath(map, responsePath);
      if (extracted instanceof List<?> list) {
        List<?> filtered = filterList(list, year, keywords);
        Map<String, Object> wrapper = new HashMap<>();
        if (responsePath != null && !responsePath.isBlank()) {
          wrapper.put("path", responsePath);
        }
        wrapper.put("list", filtered);
        wrapper.put("totalRegisters", filtered.size());
        return wrapper;
      }
      if (map.containsKey("list") && map.get("list") instanceof List<?> list) {
        List<?> filtered = filterList(list, year, keywords);
        Map<String, Object> copy = new HashMap<>();
        map.forEach((key, value) -> copy.put(String.valueOf(key), value));
        copy.put("list", filtered);
        copy.put("totalRegisters", filtered.size());
        return copy;
      }
      return map;
    }
    if (data instanceof List<?> list) {
      return filterList(list, year, keywords);
    }
    return data;
  }

  private List<?> filterList(List<?> list, Integer year, List<String> keywords) {
    if (list == null || list.isEmpty()) {
      return List.of();
    }
    return list.stream()
        .filter(item -> {
          if (year != null) {
            Integer itemYear = extractYearFromItem(item);
            if (itemYear == null || !itemYear.equals(year)) {
              return false;
            }
          }
          if (keywords == null || keywords.isEmpty()) {
            return true;
          }
          String haystack = String.valueOf(item).toLowerCase();
          for (String keyword : keywords) {
            if (haystack.contains(keyword.toLowerCase())) {
              return true;
            }
          }
          return false;
        })
        .limit(10)
        .toList();
  }

  private List<Object> extractItems(Object data, String responsePath) {
    if (data == null) {
      return List.of();
    }
    if (data instanceof List<?> list) {
      return new ArrayList<>(list);
    }
    if (data instanceof Map<?, ?> map) {
      Object extracted = extractByPath(map, responsePath);
      if (extracted instanceof List<?> list) {
        return new ArrayList<>(list);
      }
      Object listObj = map.get("list");
      if (listObj instanceof List<?> list) {
        return new ArrayList<>(list);
      }
    }
    return List.of();
  }

  private Integer extractYear(String message) {
    if (message == null) {
      return null;
    }
    java.util.regex.Matcher matcher =
        java.util.regex.Pattern.compile("\\b(19|20)\\d{2}\\b").matcher(message);
    if (matcher.find()) {
      try {
        return Integer.parseInt(matcher.group());
      } catch (NumberFormatException ex) {
        return null;
      }
    }
    return null;
  }

  private Integer extractYearFromItem(Object item) {
    if (item == null) {
      return null;
    }
    if (item instanceof Map<?, ?> map) {
      Object yearValue = map.get("year");
      if (yearValue instanceof Number) {
        return ((Number) yearValue).intValue();
      }
      if (yearValue != null) {
        try {
          return Integer.parseInt(String.valueOf(yearValue));
        } catch (NumberFormatException ex) {
          return null;
        }
      }
    }
    return null;
  }

  private List<String> extractMessageKeywords(String message) {
    if (message == null || message.isBlank()) {
      return List.of();
    }
    String lower = message.toLowerCase();
    String[] parts = lower.split("[^a-záéíóúñ0-9]+");
    List<String> tokens = new ArrayList<>();
    List<String> stopwords =
        List.of(
            "el",
            "la",
            "los",
            "las",
            "de",
            "del",
            "un",
            "una",
            "unos",
            "unas",
            "y",
            "o",
            "que",
            "por",
            "para",
            "con",
            "sin",
            "en",
            "a",
            "al",
            "lo",
            "me",
            "te",
            "se",
            "es",
            "son",
            "como",
            "qué",
            "cual",
            "cuál",
            "cuánto",
            "cuanta",
            "cuantas",
            "cuantos",
            "sobre",
            "dame",
            "quiero",
            "necesito");
    for (String part : parts) {
      if (part.length() < 3) {
        continue;
      }
      if (stopwords.contains(part)) {
        continue;
      }
      tokens.add(part);
    }
    return tokens;
  }

  private int countItems(Object data, String responsePath) {
    if (data == null) {
      return 0;
    }
    if (data instanceof List<?> list) {
      return list.size();
    }
    if (data instanceof Map<?, ?> map) {
      Object extracted = extractByPath(map, responsePath);
      if (extracted instanceof List<?> extractedList) {
        return extractedList.size();
      }
      Object listObj = map.get("list");
      if (listObj instanceof List<?> list) {
        return list.size();
      }
    }
    return 0;
  }

  private int toInt(Object value) {
    if (value == null) {
      return 0;
    }
    if (value instanceof Number number) {
      return number.intValue();
    }
    try {
      return Integer.parseInt(String.valueOf(value));
    } catch (NumberFormatException ex) {
      return 0;
    }
  }

  private Object extractByPath(Object data, String responsePath) {
    if (responsePath == null || responsePath.isBlank()) {
      return null;
    }
    if (!(data instanceof Map<?, ?>) && !(data instanceof List<?>)) {
      return null;
    }
    String[] parts = responsePath.split("\\.");
    Object current = data;
    for (String part : parts) {
      if (current == null) {
        return null;
      }
      String trimmed = part.trim();
      if (trimmed.isEmpty()) {
        continue;
      }
      if (current instanceof Map<?, ?> map) {
        current = map.get(trimmed);
        continue;
      }
      if (current instanceof List<?> list) {
        try {
          int index = Integer.parseInt(trimmed);
          current = index >= 0 && index < list.size() ? list.get(index) : null;
        } catch (NumberFormatException ex) {
          return null;
        }
        continue;
      }
      return null;
    }
    return current;
  }

  private static class EndpointFetch {
    boolean ok = false;
    Object data = null;
    int status = 0;
    String error = null;
  }

  private static class ScoredEndpoint {
    final TenantServiceEndpointResponse endpoint;
    final int score;

    private ScoredEndpoint(TenantServiceEndpointResponse endpoint, int score) {
      this.endpoint = endpoint;
      this.score = score;
    }
  }

  private static class EndpointContext {
    String context = "";
    boolean refuse = false;
    String suggestion = null;
  }

  private List<String> extractScopeKeywords(String prompt) {
    if (prompt == null || prompt.isBlank()) {
      return List.of();
    }
    String[] lines = prompt.split("\\r?\\n");
    String[] labels = {
      "ámbito permitido:",
      "ambito permitido:",
      "allowed topics:",
      "scope:",
      "topics:"
    };
    for (String line : lines) {
      String trimmed = line.trim();
      if (trimmed.isBlank()) {
        continue;
      }
      String lower = trimmed.toLowerCase(Locale.ROOT);
      String labelFound = null;
      int labelIndex = -1;
      for (String label : labels) {
        labelIndex = lower.indexOf(label);
        if (labelIndex >= 0) {
          labelFound = label;
          break;
        }
      }
      if (labelFound != null) {
        String raw = trimmed.substring(labelIndex + labelFound.length()).trim();
        raw = raw.replaceAll("^[\"'“”]+|[\"'“”]+$", "").trim();
        if (raw.isBlank()) {
          return List.of();
        }
        return java.util.Arrays.stream(raw.split(","))
            .map(String::trim)
            .filter(item -> !item.isBlank())
            .toList();
      }
    }
    return List.of();
  }

  private String extractOutOfScopeResponse(String prompt) {
    if (prompt == null || prompt.isBlank()) {
      return null;
    }
    String[] lines = prompt.split("\\r?\\n");
    String[] labels = {
      "respuesta fuera de ámbito:",
      "respuesta fuera de ambito:",
      "out-of-scope response:"
    };
    for (String line : lines) {
      String trimmed = line.trim();
      if (trimmed.isBlank()) {
        continue;
      }
      String lower = trimmed.toLowerCase(Locale.ROOT);
      String labelFound = null;
      int labelIndex = -1;
      for (String label : labels) {
        labelIndex = lower.indexOf(label);
        if (labelIndex >= 0) {
          labelFound = label;
          break;
        }
      }
      if (labelFound != null) {
        String raw = trimmed.substring(labelIndex + labelFound.length()).trim();
        raw = raw.replaceAll("^[\"'“”]+|[\"'“”]+$", "").trim();
        return raw.isBlank() ? null : raw;
      }
    }
    return null;
  }

  private boolean isOutOfScope(String message, List<String> scopeKeywords) {
    if (message == null || message.isBlank() || scopeKeywords.isEmpty()) {
      return false;
    }
    String normalized = normalizeText(message);
    String[] tokens = normalized.split("[^a-z0-9]+");
    for (String keyword : scopeKeywords) {
      if (keyword != null && !keyword.isBlank()) {
        String normalizedKeyword = normalizeText(keyword);
        if (normalizedKeyword.isBlank()) {
          continue;
        }
        if (normalized.contains(normalizedKeyword)) {
          return false;
        }
        for (String token : tokens) {
          if (token.length() < 3) {
            continue;
          }
          if (normalizedKeyword.contains(token) || token.contains(normalizedKeyword)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  private String normalizeText(String value) {
    if (value == null) {
      return "";
    }
    String lower = value.toLowerCase(Locale.ROOT).trim();
    String normalized = Normalizer.normalize(lower, Normalizer.Form.NFD);
    return normalized.replaceAll("\\p{M}+", "");
  }
}
