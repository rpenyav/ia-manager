package com.neria.manager.common.repos;

import com.neria.manager.common.entities.ChatMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {
  List<ChatMessage> findByTenantIdAndConversationIdOrderByCreatedAtAsc(
      String tenantId, String conversationId);

  List<ChatMessage> findTop20ByTenantIdAndConversationIdOrderByCreatedAtDesc(
      String tenantId, String conversationId);

  void deleteByTenantIdAndConversationId(String tenantId, String conversationId);
}
