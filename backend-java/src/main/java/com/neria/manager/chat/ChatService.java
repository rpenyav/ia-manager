package com.neria.manager.chat;

import com.neria.manager.common.entities.ChatConversation;
import com.neria.manager.common.entities.ChatMessage;
import com.neria.manager.common.entities.ChatUser;
import com.neria.manager.common.repos.ChatConversationRepository;
import com.neria.manager.common.repos.ChatMessageRepository;
import com.neria.manager.common.repos.ChatUserRepository;
import com.neria.manager.runtime.ExecuteRequest;
import com.neria.manager.runtime.RuntimeService;
import com.neria.manager.tenantservices.TenantServicesService;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ChatService {
  private final ChatConversationRepository conversationsRepository;
  private final ChatMessageRepository messagesRepository;
  private final ChatUserRepository usersRepository;
  private final RuntimeService runtimeService;
  private final ChatAuthService chatAuthService;
  private final TenantServicesService tenantServicesService;

  public ChatService(
      ChatConversationRepository conversationsRepository,
      ChatMessageRepository messagesRepository,
      ChatUserRepository usersRepository,
      RuntimeService runtimeService,
      ChatAuthService chatAuthService,
      TenantServicesService tenantServicesService) {
    this.conversationsRepository = conversationsRepository;
    this.messagesRepository = messagesRepository;
    this.usersRepository = usersRepository;
    this.runtimeService = runtimeService;
    this.chatAuthService = chatAuthService;
    this.tenantServicesService = tenantServicesService;
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

  public Map<String, Object> addMessage(
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
    List<Map<String, String>> payloadMessages =
        history.stream()
            .map(item -> Map.of("role", item.getRole(), "content", item.getContent()))
            .toList();

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

    return Map.of("conversationId", conversationId, "message", assistantMessage, "output", output);
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
}
