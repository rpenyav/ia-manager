package com.neria.manager.chatbots;

import com.neria.manager.dbconnections.DbConnectionsService;
import com.neria.manager.ocr.OcrDocumentsService;
import com.neria.manager.runtime.ExecuteRequest;
import com.neria.manager.runtime.RuntimeService;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ChatbotsService {
  private final RuntimeService runtimeService;
  private final OcrDocumentsService ocrDocumentsService;
  private final DbConnectionsService dbConnectionsService;

  public ChatbotsService(
      RuntimeService runtimeService,
      OcrDocumentsService ocrDocumentsService,
      DbConnectionsService dbConnectionsService) {
    this.runtimeService = runtimeService;
    this.ocrDocumentsService = ocrDocumentsService;
    this.dbConnectionsService = dbConnectionsService;
  }

  public Object generic(String tenantId, ChatbotGenericRequest dto) {
    ExecuteRequest request = new ExecuteRequest();
    request.providerId = dto.providerId;
    request.model = dto.model;
    request.requestId = dto.requestId;
    request.payload = Map.of("messages", dto.messages);
    return runtimeService.execute(tenantId, request);
  }

  public Object ocr(String tenantId, ChatbotOcrRequest dto) {
    var doc = ocrDocumentsService.getById(tenantId, dto.documentId);
    if (!doc.isEnabled()) {
      throw new IllegalStateException("OCR document disabled");
    }
    String content = ocrDocumentsService.getDecryptedContent(doc);
    String trimmed = content.length() > 12000 ? content.substring(0, 12000) : content;

    List<Map<String, String>> messages =
        List.of(
            Map.of(
                "role",
                "system",
                "content",
                "Eres un asistente experto en lectura de documentos. Responde solo con la informacion del documento."),
            Map.of("role", "user", "content", "Documento OCR:\n" + trimmed + "\n\nPregunta: " + dto.question));

    ExecuteRequest request = new ExecuteRequest();
    request.providerId = dto.providerId;
    request.model = dto.model;
    request.requestId = dto.requestId;
    request.payload = Map.of("messages", messages);
    return runtimeService.execute(tenantId, request);
  }

  public Object sql(String tenantId, ChatbotSqlRequest dto) {
    var connection = dbConnectionsService.getById(tenantId, dto.connectionId);
    if (!connection.isEnabled()) {
      throw new IllegalStateException("DB connection disabled");
    }

    Map<String, Object> config = dbConnectionsService.getDecryptedConfig(connection);
    String schema = fetchSchemaSummary(dbConnectionsService.getAllowedTables(connection), config);

    List<Map<String, String>> prompt =
        List.of(
            Map.of(
                "role",
                "system",
                "content",
                "Eres un asistente que genera una unica consulta SQL de solo lectura (MySQL). Devuelve solo SQL sin explicaciones."),
            Map.of("role", "user", "content", "Esquema:\n" + schema + "\n\nPregunta: " + dto.question));

    String sql = dto.sql;
    if (sql == null || sql.isBlank()) {
      ExecuteRequest request = new ExecuteRequest();
      request.providerId = dto.providerId;
      request.model = dto.model;
      request.requestId = dto.requestId;
      request.payload = Map.of("messages", prompt);
      Object response = runtimeService.execute(tenantId, request);
      sql = extractSql(response);
    }

    if (sql == null || sql.isBlank()) {
      throw new IllegalStateException("No SQL generated");
    }

    validateReadOnly(sql, connection.isReadOnly());
    List<Map<String, Object>> rows = executeQuery(config, sql);
    return Map.of("requestId", dto.requestId, "sql", sql, "rows", rows);
  }

  private String extractSql(Object response) {
    if (!(response instanceof Map)) {
      return null;
    }
    Map<String, Object> map = (Map<String, Object>) response;
    Object output = map.get("output");
    if (!(output instanceof Map)) {
      return null;
    }
    Map<String, Object> outputMap = (Map<String, Object>) output;
    Object choicesObj = outputMap.get("choices");
    if (choicesObj instanceof List<?> choices && !choices.isEmpty()) {
      Object first = choices.get(0);
      if (first instanceof Map<?, ?> firstMap) {
        Object message = firstMap.get("message");
        if (message instanceof Map<?, ?> messageMap) {
          Object content = messageMap.get("content");
          if (content != null) {
            return stripSqlFence(String.valueOf(content));
          }
        }
        Object text = firstMap.get("text");
        if (text != null) {
          return stripSqlFence(String.valueOf(text));
        }
      }
    }
    Object responseField = outputMap.get("response");
    return responseField != null ? stripSqlFence(String.valueOf(responseField)) : null;
  }

  private String stripSqlFence(String content) {
    String trimmed = content.trim();
    if (trimmed.startsWith("```")) {
      int start = trimmed.indexOf("\n");
      int end = trimmed.lastIndexOf("```");
      if (start > 0 && end > start) {
        return trimmed.substring(start + 1, end).trim();
      }
    }
    return trimmed;
  }

  private void validateReadOnly(String sql, boolean readOnly) {
    if (!readOnly) {
      return;
    }
    String normalized = sql.trim().toLowerCase();
    List<String> allowed = List.of("select", "with", "show", "describe", "explain");
    boolean ok = allowed.stream().anyMatch(normalized::startsWith);
    if (!ok) {
      throw new IllegalStateException("Only read-only queries are allowed");
    }
  }

  private List<Map<String, Object>> executeQuery(Map<String, Object> config, String sql) {
    String host = String.valueOf(config.getOrDefault("host", ""));
    int port = Integer.parseInt(String.valueOf(config.getOrDefault("port", "3306")));
    String user = String.valueOf(config.getOrDefault("user", ""));
    String password = String.valueOf(config.getOrDefault("password", ""));
    String database = String.valueOf(config.getOrDefault("database", ""));
    String jdbc = "jdbc:mysql://" + host + ":" + port + "/" + database;

    try (Connection connection = DriverManager.getConnection(jdbc, user, password);
        Statement statement = connection.createStatement()) {
      ResultSet rs = statement.executeQuery(sql);
      List<Map<String, Object>> rows = new ArrayList<>();
      int columnCount = rs.getMetaData().getColumnCount();
      while (rs.next()) {
        java.util.Map<String, Object> row = new java.util.HashMap<>();
        for (int i = 1; i <= columnCount; i++) {
          row.put(rs.getMetaData().getColumnLabel(i), rs.getObject(i));
        }
        rows.add(row);
      }
      return rows;
    } catch (Exception ex) {
      throw new IllegalStateException("SQL execution failed: " + ex.getMessage(), ex);
    }
  }

  private String fetchSchemaSummary(List<String> allowedTables, Map<String, Object> config) {
    String host = String.valueOf(config.getOrDefault("host", ""));
    int port = Integer.parseInt(String.valueOf(config.getOrDefault("port", "3306")));
    String user = String.valueOf(config.getOrDefault("user", ""));
    String password = String.valueOf(config.getOrDefault("password", ""));
    String database = String.valueOf(config.getOrDefault("database", ""));
    if (database == null || database.isBlank()) {
      return "Database not specified";
    }
    String jdbc = "jdbc:mysql://" + host + ":" + port + "/" + database;
    StringBuilder sql = new StringBuilder();
    sql.append(
        "SELECT TABLE_NAME as tableName, COLUMN_NAME as columnName, DATA_TYPE as dataType " +
        "FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?");
    if (allowedTables != null && !allowedTables.isEmpty()) {
      sql.append(" AND TABLE_NAME IN (");
      sql.append(String.join(",", java.util.Collections.nCopies(allowedTables.size(), "?")));
      sql.append(")");
    }
    sql.append(" ORDER BY TABLE_NAME, ORDINAL_POSITION LIMIT 300");

    try (Connection connection = DriverManager.getConnection(jdbc, user, password);
        PreparedStatement statement = connection.prepareStatement(sql.toString())) {
      int index = 1;
      statement.setString(index++, database);
      if (allowedTables != null) {
        for (String table : allowedTables) {
          statement.setString(index++, table);
        }
      }
      ResultSet rs = statement.executeQuery();
      java.util.Map<String, List<String>> grouped = new java.util.HashMap<>();
      while (rs.next()) {
        String table = rs.getString("tableName");
        grouped.computeIfAbsent(table, ignored -> new ArrayList<>())
            .add(rs.getString("columnName") + ":" + rs.getString("dataType"));
      }
      StringBuilder output = new StringBuilder();
      grouped.forEach((table, cols) -> {
        if (!output.isEmpty()) {
          output.append("\n");
        }
        output.append(table).append("(").append(String.join(", ", cols)).append(")");
      });
      return output.toString();
    } catch (Exception ex) {
      throw new IllegalStateException("Schema fetch failed: " + ex.getMessage(), ex);
    }
  }

  public static class ChatbotGenericRequest {
    public String providerId;
    public String model;
    public String requestId;
    public List<Map<String, String>> messages;
  }

  public static class ChatbotOcrRequest {
    public String providerId;
    public String model;
    public String requestId;
    public String documentId;
    public String question;
  }

  public static class ChatbotSqlRequest {
    public String providerId;
    public String model;
    public String requestId;
    public String connectionId;
    public String question;
    public String sql;
  }
}
