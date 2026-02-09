import { useEffect, useMemo, useState } from 'react';

type Message = {
  id?: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  createdAt?: string;
};

type ChatUser = {
  id: string;
  email: string;
  name?: string | null;
  status: string;
};

type Conversation = {
  id: string;
  title?: string | null;
  model: string;
  userId: string;
  updatedAt: string;
};

type EndpointOption = {
  label: string;
  value: 'persisted' | 'chatbots' | 'runtime';
};

const endpointOptions: EndpointOption[] = [
  { label: 'Chat persistente', value: 'persisted' },
  { label: 'Chatbot genérico', value: 'chatbots' },
  { label: 'Runtime directo', value: 'runtime' }
];

const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const defaultApiKey = import.meta.env.VITE_API_KEY || '';
const defaultProviderId = import.meta.env.VITE_PROVIDER_ID || '';
const defaultModel = import.meta.env.VITE_MODEL || 'gpt-4o-mini';
const defaultTenantId = import.meta.env.VITE_TENANT_ID || '';
const defaultEndpoint = (import.meta.env.VITE_CHAT_ENDPOINT || 'persisted') as
  | 'persisted'
  | 'chatbots'
  | 'runtime';

export default function App() {
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [apiKey, setApiKey] = useState(defaultApiKey);
  const [providerId, setProviderId] = useState(defaultProviderId);
  const [model, setModel] = useState(defaultModel);
  const [tenantId, setTenantId] = useState(defaultTenantId);
  const [endpointMode, setEndpointMode] = useState<EndpointOption['value']>(
    endpointOptions.some((item) => item.value === defaultEndpoint)
      ? defaultEndpoint
      : 'persisted'
  );
  const [systemPrompt, setSystemPrompt] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);

  const [chatEmail, setChatEmail] = useState('');
  const [chatName, setChatName] = useState('');
  const [chatPassword, setChatPassword] = useState('');
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [chatToken, setChatToken] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('pm_chat_token');
    const storedUser = localStorage.getItem('pm_chat_user');
    if (storedToken) {
      setChatToken(storedToken);
    }
    if (storedUser) {
      try {
        setChatUser(JSON.parse(storedUser) as ChatUser);
      } catch (err) {
        localStorage.removeItem('pm_chat_user');
      }
    }
  }, []);

  useEffect(() => {
    if (endpointMode === 'persisted' && chatToken) {
      loadConversations(chatToken).catch(() => undefined);
    }
  }, [endpointMode, chatToken, baseUrl, apiKey]);

  const history = useMemo(() => {
    const list = [...messages];
    if (systemPrompt.trim() && endpointMode !== 'persisted') {
      list.unshift({ role: 'system', content: systemPrompt.trim() });
    }
    return list;
  }, [messages, systemPrompt, endpointMode]);

  const canSend =
    baseUrl.trim() &&
    apiKey.trim() &&
    providerId.trim() &&
    model.trim() &&
    input.trim().length > 0 &&
    !loading &&
    (endpointMode !== 'persisted' || Boolean(chatToken));

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey.trim()
  };

  if (tenantId.trim()) {
    baseHeaders['x-tenant-id'] = tenantId.trim();
  }

  const loadConversations = async (token: string) => {
    const response = await fetch(`${baseUrl}/chat/conversations`, {
      headers: {
        ...baseHeaders,
        'x-chat-token': token
      }
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API ${response.status}: ${text}`);
    }
    const data = (await response.json()) as Conversation[];
    setConversations(data);
  };

  const loadMessages = async (conversationId: string) => {
    const response = await fetch(`${baseUrl}/chat/conversations/${conversationId}/messages`, {
      headers: {
        ...baseHeaders,
        'x-chat-token': chatToken
      }
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API ${response.status}: ${text}`);
    }
    const data = (await response.json()) as Message[];
    setMessages(data);
    setActiveConversationId(conversationId);
  };

  const handleLogin = async () => {
    if (!apiKey.trim() || !chatEmail.trim() || !chatPassword.trim()) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/chat/auth/login`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({ email: chatEmail.trim(), password: chatPassword })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API ${response.status}: ${text}`);
      }
      const data = await response.json();
      setChatToken(data.accessToken);
      setChatUser(data.user);
      localStorage.setItem('pm_chat_token', data.accessToken);
      localStorage.setItem('pm_chat_user', JSON.stringify(data.user));
      await loadConversations(data.accessToken);
      setMessages([]);
      setActiveConversationId(null);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!apiKey.trim() || !chatEmail.trim() || !chatPassword.trim()) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/chat/auth/register`, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({
          email: chatEmail.trim(),
          password: chatPassword,
          name: chatName.trim() || undefined
        })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API ${response.status}: ${text}`);
      }
      const data = await response.json();
      setChatToken(data.accessToken);
      setChatUser(data.user);
      localStorage.setItem('pm_chat_token', data.accessToken);
      localStorage.setItem('pm_chat_user', JSON.stringify(data.user));
      await loadConversations(data.accessToken);
      setMessages([]);
      setActiveConversationId(null);
    } catch (err: any) {
      setError(err.message || 'Error registrando usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setChatToken('');
    setChatUser(null);
    setConversations([]);
    setMessages([]);
    setActiveConversationId(null);
    localStorage.removeItem('pm_chat_token');
    localStorage.removeItem('pm_chat_user');
  };

  const handleSend = async () => {
    if (!canSend) {
      return;
    }
    const userMessage: Message = { role: 'user', content: input.trim() };
    setInput('');
    setLoading(true);
    setError(null);
    setRawResponse(null);

    try {
      if (endpointMode === 'persisted') {
        let conversationId = activeConversationId;
        if (!conversationId) {
          const title = userMessage.content.slice(0, 48);
          const createResponse = await fetch(`${baseUrl}/chat/conversations`, {
            method: 'POST',
            headers: {
              ...baseHeaders,
              'x-chat-token': chatToken
            },
            body: JSON.stringify({
              providerId,
              model,
              title,
              systemPrompt: systemPrompt.trim() || undefined
            })
          });
          if (!createResponse.ok) {
            const text = await createResponse.text();
            throw new Error(`API ${createResponse.status}: ${text}`);
          }
          const created = (await createResponse.json()) as Conversation;
          conversationId = created.id;
          setActiveConversationId(created.id);
          setConversations((prev) => [created, ...prev]);
        }

        const response = await fetch(`${baseUrl}/chat/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: {
            ...baseHeaders,
            'x-chat-token': chatToken
          },
          body: JSON.stringify({ content: userMessage.content })
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(`API ${response.status}: ${text}`);
        }

        const data = await response.json();
        setRawResponse(data.output || data);
        await loadMessages(conversationId);
        await loadConversations(chatToken);
        return;
      }

      const url =
        endpointMode === 'chatbots' ? `${baseUrl}/chatbots/generic` : `${baseUrl}/runtime/execute`;
      const body =
        endpointMode === 'chatbots'
          ? {
              providerId,
              model,
              messages: history.concat(userMessage)
            }
          : {
              providerId,
              model,
              payload: { messages: history.concat(userMessage) }
            };

      const response = await fetch(url, {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API ${response.status}: ${text}`);
      }

      const data = await response.json();
      setRawResponse(data);
      const output = data?.output || data;
      const assistantContent =
        output?.choices?.[0]?.message?.content ||
        output?.choices?.[0]?.text ||
        output?.response ||
        JSON.stringify(output);

      setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: assistantContent }]);
    } catch (err: any) {
      setError(err.message || 'Error en la llamada');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setRawResponse(null);
    setError(null);
    setActiveConversationId(null);
  };

  return (
    <div className="app">
      <aside className="panel">
        <div className="brand">
          <div className="brand-mark">SB</div>
          <div>
            <div className="brand-title">Sandbox</div>
            <div className="brand-subtitle">Chatbot cliente</div>
          </div>
        </div>

        <div className="section">
          <h3>Conexión</h3>
          <label>
            API Base URL
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </label>
          <label>
            API Key
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" />
          </label>
          <label>
            Tenant ID (opcional)
            <input value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
          </label>
        </div>

        <div className="section">
          <h3>Modo</h3>
          <label>
            Endpoint
            <select value={endpointMode} onChange={(e) => setEndpointMode(e.target.value as EndpointOption['value'])}>
              {endpointOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {endpointMode === 'persisted' && (
          <div className="section">
            <h3>Usuario</h3>
            {chatUser ? (
              <div className="user-summary">
                <div className="user-pill">{chatUser.name || chatUser.email}</div>
                <button className="btn" onClick={handleLogout} disabled={loading}>
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <>
                <label>
                  Nombre (opcional)
                  <input value={chatName} onChange={(e) => setChatName(e.target.value)} />
                </label>
                <label>
                  Email
                  <input value={chatEmail} onChange={(e) => setChatEmail(e.target.value)} />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={chatPassword}
                    onChange={(e) => setChatPassword(e.target.value)}
                  />
                </label>
                <div className="btn-row">
                  <button className="btn" onClick={handleLogin} disabled={loading}>
                    Entrar
                  </button>
                  <button className="btn" onClick={handleRegister} disabled={loading}>
                    Registrar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="section">
          <h3>Modelo</h3>
          <label>
            Provider ID
            <input value={providerId} onChange={(e) => setProviderId(e.target.value)} />
          </label>
          <label>
            Modelo
            <input value={model} onChange={(e) => setModel(e.target.value)} />
          </label>
        </div>

        <div className="section">
          <h3>System prompt</h3>
          <textarea
            rows={4}
            placeholder="Opcional..."
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
          />
        </div>

        {endpointMode === 'persisted' && (
          <div className="section">
            <h3>Conversaciones</h3>
            <div className="conversation-list">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  className={`conversation-item ${
                    activeConversationId === conversation.id ? 'active' : ''
                  }`}
                  onClick={() => loadMessages(conversation.id)}
                  disabled={loading}
                >
                  <div>
                    <div className="conversation-title">
                      {conversation.title || 'Sin título'}
                    </div>
                    <div className="conversation-meta">
                      {new Date(conversation.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </button>
              ))}
              {conversations.length === 0 && (
                <div className="conversation-empty">Aún no hay conversaciones.</div>
              )}
            </div>
          </div>
        )}

        <div className="section">
          <button className="btn" onClick={handleReset}>
            Nueva conversación
          </button>
        </div>
      </aside>

      <main className="chat">
        <header className="chat-header">
          <h1>Chatbot Sandbox</h1>
          <p>Prueba rápida con la API del cliente.</p>
        </header>

        <div className="messages">
          {messages.length === 0 && <div className="empty">Empieza escribiendo un mensaje.</div>}
          {messages.map((msg, index) => (
            <div className={`message ${msg.role}`} key={msg.id || `${msg.role}-${index}`}>
              <div className="role">{msg.role}</div>
              <div className="content">{msg.content}</div>
            </div>
          ))}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="composer">
          <textarea
            rows={3}
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn primary" onClick={handleSend} disabled={!canSend}>
            {loading ? 'Enviando…' : 'Enviar'}
          </button>
        </div>

        {rawResponse && (
          <div className="raw">
            <div className="raw-title">Respuesta completa</div>
            <pre>{JSON.stringify(rawResponse, null, 2)}</pre>
          </div>
        )}
      </main>
    </div>
  );
}
