package com.neria.manager.common.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "chat_messages")
public class ChatMessage {
  @Id
  @Column(length = 36)
  private String id;

  @Column(name = "conversationId", length = 36, nullable = false)
  private String conversationId;

  @Column(name = "tenantId", length = 36, nullable = false)
  private String tenantId;

  @Column(name = "userId", length = 36, nullable = false)
  private String userId;

  @Column(length = 16, nullable = false)
  private String role;

  @Column(columnDefinition = "text", nullable = false)
  private String content;

  @Column(name = "tokensIn", nullable = false)
  private int tokensIn;

  @Column(name = "tokensOut", nullable = false)
  private int tokensOut;

  @Column(name = "createdAt")
  private LocalDateTime createdAt;
}
