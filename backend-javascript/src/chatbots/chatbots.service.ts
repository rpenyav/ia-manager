import { Injectable } from '@nestjs/common';
import mysql from 'mysql2/promise';
import { RuntimeService } from '../runtime/runtime.service';
import { OcrDocumentsService } from '../ocr/ocr-documents.service';
import { DbConnectionsService } from '../db-connections/db-connections.service';
import { ChatbotGenericDto } from './dto/chatbot-generic.dto';
import { ChatbotOcrDto } from './dto/chatbot-ocr.dto';
import { ChatbotSqlDto } from './dto/chatbot-sql.dto';

@Injectable()
export class ChatbotsService {
  constructor(
    private readonly runtimeService: RuntimeService,
    private readonly ocrDocumentsService: OcrDocumentsService,
    private readonly dbConnectionsService: DbConnectionsService
  ) {}

  async generic(tenantId: string, dto: ChatbotGenericDto) {
    return this.runtimeService.execute(tenantId, {
      providerId: dto.providerId,
      model: dto.model,
      requestId: dto.requestId,
      payload: {
        messages: dto.messages
      }
    });
  }

  async ocr(tenantId: string, dto: ChatbotOcrDto) {
    const doc = await this.ocrDocumentsService.getById(tenantId, dto.documentId);
    if (!doc.enabled) {
      throw new Error('OCR document disabled');
    }
    const content = await this.ocrDocumentsService.getDecryptedContent(doc);
    const trimmed = content.slice(0, 12000);

    const messages = [
      {
        role: 'system',
        content:
          'Eres un asistente experto en lectura de documentos. Responde solo con la informacion del documento.'
      },
      {
        role: 'user',
        content: `Documento OCR:\\n${trimmed}\\n\\nPregunta: ${dto.question}`
      }
    ];

    return this.runtimeService.execute(tenantId, {
      providerId: dto.providerId,
      model: dto.model,
      requestId: dto.requestId,
      payload: { messages }
    });
  }

  async sql(tenantId: string, dto: ChatbotSqlDto) {
    const connection = await this.dbConnectionsService.getById(tenantId, dto.connectionId);
    if (!connection.enabled) {
      throw new Error('DB connection disabled');
    }

    const config = await this.dbConnectionsService.getDecryptedConfig(connection);
    const schema = await this.fetchSchemaSummary(connection, config);

    const sqlPrompt = [
      {
        role: 'system',
        content:
          'Eres un asistente que genera una unica consulta SQL de solo lectura (MySQL). Devuelve solo SQL sin explicaciones.'
      },
      {
        role: 'user',
        content: `Esquema:\\n${schema}\\n\\nPregunta: ${dto.question}`
      }
    ];

    let sql = dto.sql;
    if (!sql) {
      const response = await this.runtimeService.execute(tenantId, {
        providerId: dto.providerId,
        model: dto.model,
        requestId: dto.requestId,
        payload: { messages: sqlPrompt }
      });
      const output = response.output as any;
      const content = output?.choices?.[0]?.message?.content || output?.choices?.[0]?.text || '';
      sql = this.extractSql(content);
    }

    if (!sql) {
      throw new Error('No SQL generated');
    }

    this.validateReadOnly(sql, connection.readOnly);

    const rows = await this.executeQuery(config, sql);
    return {
      requestId: dto.requestId,
      sql,
      rows
    };
  }

  private extractSql(content: string) {
    const fenced = content.match(/```sql\\s*([\\s\\S]*?)```/i);
    if (fenced?.[1]) {
      return fenced[1].trim();
    }
    return content.trim();
  }

  private validateReadOnly(sql: string, readOnly: boolean) {
    if (!readOnly) {
      return;
    }
    const normalized = sql.trim().toLowerCase();
    const allowed = ['select', 'with', 'show', 'describe', 'explain'];
    if (!allowed.some((prefix) => normalized.startsWith(prefix))) {
      throw new Error('Only read-only queries are allowed');
    }
  }

  private async executeQuery(config: Record<string, unknown>, sql: string) {
    const connection = await mysql.createConnection({
      host: String(config.host || ''),
      port: Number(config.port || 3306),
      user: String(config.user || ''),
      password: String(config.password || ''),
      database: String(config.database || ''),
      ssl: config.ssl ? (config.ssl as any) : undefined
    });

    try {
      const [rows] = await connection.query(sql);
      return rows;
    } finally {
      await connection.end();
    }
  }

  private async fetchSchemaSummary(connection: { allowedTables: string[] }, config: Record<string, unknown>) {
    const allowed = connection.allowedTables ?? [];
    const db = String(config.database || '');
    if (!db) {
      return 'Database not specified';
    }

    const conn = await mysql.createConnection({
      host: String(config.host || ''),
      port: Number(config.port || 3306),
      user: String(config.user || ''),
      password: String(config.password || ''),
      database: db,
      ssl: config.ssl ? (config.ssl as any) : undefined
    });

    try {
      const [rows] = await conn.query(
        `SELECT TABLE_NAME as tableName, COLUMN_NAME as columnName, DATA_TYPE as dataType\n         FROM information_schema.COLUMNS\n         WHERE TABLE_SCHEMA = ?\n         ${allowed.length ? `AND TABLE_NAME IN (${allowed.map(() => '?').join(',')})` : ''}\n         ORDER BY TABLE_NAME, ORDINAL_POSITION\n         LIMIT 300`,
        allowed.length ? [db, ...allowed] : [db]
      );
      const lines: string[] = [];
      const grouped: Record<string, string[]> = {};
      (rows as any[]).forEach((row) => {
        const table = row.tableName;
        if (!grouped[table]) {
          grouped[table] = [];
        }
        grouped[table].push(`${row.columnName}:${row.dataType}`);
      });
      Object.entries(grouped).forEach(([table, cols]) => {
        lines.push(`${table}(${cols.join(', ')})`);
      });
      return lines.join('\\n');
    } finally {
      await conn.end();
    }
  }
}
