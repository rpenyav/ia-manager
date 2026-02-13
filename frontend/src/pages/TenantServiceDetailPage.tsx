import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { api } from "../api";
import { DataTable } from "../components/DataTable";
import { StatusBadgeIcon } from "../components/StatusBadgeIcon";
import { LoaderComponent } from "../components/LoaderComponent";
import { PageWithDocs } from "../components/PageWithDocs";
import { InfoTooltip } from "../components/InfoTooltip";
import { useAuth } from "../auth";
import { emitToast } from "../toast";
import type {
  ApiKeySummary,
  ChatConversation,
  ChatMessage,
  ChatUserSummary,
  Policy,
  Provider,
  PricingEntry,
  TenantServiceEndpoint,
  TenantServiceOverview,
  TenantServiceUser,
} from "../types";

export function TenantServiceDetailPage() {
  const { tenantId, serviceCode } = useParams();
  const navigate = useNavigate();
  const { role, tenantId: authTenantId } = useAuth();
  const canManageServices = role === "admin" || role === "tenant";
  const canManageChatUsers = role === "admin" || role === "tenant";
  const canManagePolicies = role === "admin";
  const canManageConversations = role === "admin";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [service, setService] = useState<TenantServiceOverview | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [pricing, setPricing] = useState<PricingEntry[]>([]);
  const [policyCatalog, setPolicyCatalog] = useState<Policy[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUserSummary[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [serviceEndpoints, setServiceEndpoints] = useState<
    TenantServiceEndpoint[]
  >([]);
  const [serviceUsers, setServiceUsers] = useState<TenantServiceUser[]>([]);
  const [chatConversations, setChatConversations] = useState<
    ChatConversation[]
  >([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [chatBusy, setChatBusy] = useState(false);
  const [serviceConfigDraft, setServiceConfigDraft] = useState({
    status: "active" as "active" | "suspended",
    apiBaseUrl: "",
    systemPrompt: "",
    providerId: "",
    pricingId: "",
    policyId: "",
  });
  const [serviceRuntimeForm, setServiceRuntimeForm] = useState({
    providerId: "",
    model: "",
    payload: '{"messages":[{"role":"user","content":"Hola"}]}',
  });
  const [serviceRuntimeResult, setServiceRuntimeResult] = useState<any>(null);
  const [serviceRuntimeError, setServiceRuntimeError] = useState<string | null>(
    null,
  );
  const [serviceEndpointDraft, setServiceEndpointDraft] = useState({
    id: "",
    slug: "",
    method: "POST",
    path: "",
    baseUrl: "",
    headers: "",
    enabled: true,
  });
  const [serviceEndpointMode, setServiceEndpointMode] = useState<
    "create" | "edit"
  >("create");
  const [serviceAssignUserId, setServiceAssignUserId] = useState("");
  const [serviceBusy, setServiceBusy] = useState(false);
  const [serviceRuntimeBusy, setServiceRuntimeBusy] = useState(false);
  const activeApiKey = useMemo(
    () => apiKeys.find((key) => key.status === "active") || null,
    [apiKeys],
  );
  const apiBaseUrl = (() => {
    const fallback =
      import.meta.env.MODE === "production"
        ? "https://backend-production-fc6a.up.railway.app"
        : "http://localhost:3000";
    let resolved = import.meta.env.VITE_API_BASE_URL || fallback;
    if (import.meta.env.MODE === "production" && resolved.includes("localhost")) {
      resolved = "https://backend-production-fc6a.up.railway.app";
    }
    return resolved;
  })();

  const assignedServiceUserIds = useMemo(
    () => new Set(serviceUsers.map((item) => item.userId)),
    [serviceUsers],
  );
  const availableServiceUsers = useMemo(
    () => chatUsers.filter((user) => !assignedServiceUserIds.has(user.id)),
    [chatUsers, assignedServiceUserIds],
  );
  const serviceUserRows = useMemo(
    () =>
      serviceUsers.map((assignment) => ({
        ...assignment,
        email: assignment.user.email,
        name: assignment.user.name || "",
      })),
    [serviceUsers],
  );
  const hasTenantApiKey = useMemo(
    () => apiKeys.some((key) => key.status === "active"),
    [apiKeys],
  );
  const serviceProviderId = useMemo(
    () =>
      serviceConfigDraft.providerId ||
      serviceRuntimeForm.providerId ||
      service?.providerId ||
      "",
    [
      serviceConfigDraft.providerId,
      serviceRuntimeForm.providerId,
      service?.providerId,
    ],
  );
  const serviceModel = useMemo(
    () =>
      pricing.find((entry) => entry.id === serviceConfigDraft.pricingId)
        ?.model ||
      serviceRuntimeForm.model ||
      "",
    [pricing, serviceConfigDraft.pricingId, serviceRuntimeForm.model],
  );
  const canSaveServiceConfig = useMemo(
    () =>
      Boolean(
        serviceConfigDraft.providerId.trim() &&
          serviceConfigDraft.pricingId.trim() &&
          serviceConfigDraft.policyId.trim(),
      ),
    [
      serviceConfigDraft.providerId,
      serviceConfigDraft.pricingId,
      serviceConfigDraft.policyId,
    ],
  );

  useEffect(() => {
    if (!serviceCode) {
      return;
    }
    if (role !== "tenant" || !authTenantId || !tenantId) {
      return;
    }
    if (tenantId !== authTenantId) {
      navigate(`/clients/${authTenantId}/services/${serviceCode}`, {
        replace: true,
      });
    }
  }, [role, authTenantId, tenantId, serviceCode, navigate]);

  const refreshServiceSummary = async () => {
    if (!tenantId || !serviceCode) {
      return;
    }
    const list = (await api.getTenantServices(
      tenantId,
    )) as TenantServiceOverview[];
    const match = list.find((item) => item.serviceCode === serviceCode) || null;
    setService(match);
  };

  useEffect(() => {
    if (!tenantId || !serviceCode) {
      return;
    }
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const results = await Promise.allSettled([
          api.getTenantServices(tenantId),
          api.getProviders(tenantId),
          api.getPricing(),
          api.listChatUsers(tenantId),
          api.listChatConversations(tenantId),
          api.listApiKeys(),
          canManagePolicies ? api.listPolicies() : api.getPolicy(tenantId),
        ]);

        const [
          servicesList,
          providerList,
          pricingList,
          chatUsersList,
          chatConversationsList,
          apiKeyList,
          policyData,
        ] = results.map((result) =>
          result.status === "fulfilled" ? result.value : null,
        );

        const services = (servicesList as TenantServiceOverview[]) || [];
        const match =
          services.find((item) => item.serviceCode === serviceCode) || null;
        if (!match) {
          throw new Error("Servicio no encontrado");
        }

        if (!active) {
          return;
        }

        setService(match);
        setProviders((providerList as Provider[]) || []);
        setPricing((pricingList as PricingEntry[]) || []);
        setChatUsers((chatUsersList as ChatUserSummary[]) || []);
        if (chatConversationsList) {
          const filtered = (chatConversationsList as ChatConversation[]).filter(
            (item) => item.serviceCode === serviceCode,
          );
          setChatConversations(filtered);
        } else {
          setChatConversations([]);
        }
        setChatMessages([]);
        setActiveConversationId(null);
        if (apiKeyList) {
          setApiKeys(
            (apiKeyList as ApiKeySummary[]).filter(
              (item) => item.tenantId === tenantId,
            ),
          );
        }
        if (policyData) {
          if (Array.isArray(policyData)) {
            const list = (policyData as Policy[]).filter(
              (item) => item.tenantId === tenantId,
            );
            setPolicyCatalog(list);
          } else {
            setPolicyCatalog([policyData as Policy]);
          }
        }

        setServiceConfigDraft({
          status: match.configStatus || "active",
          apiBaseUrl: match.apiBaseUrl || "",
          systemPrompt: match.systemPrompt || "",
          providerId: match.providerId || "",
          pricingId: match.pricingId || "",
          policyId: match.policyId || "",
        });
        const fallbackProviderId =
          match.providerId ||
          (providerList as Provider[])?.find((item) => item.enabled)?.id ||
          (providerList as Provider[])?.[0]?.id ||
          "";
        setServiceRuntimeForm({
          providerId: fallbackProviderId,
          model: "",
          payload: '{"messages":[{"role":"user","content":"Hola"}]}',
        });
        setServiceRuntimeResult(null);
        setServiceRuntimeError(null);
        setServiceEndpointDraft({
          id: "",
          slug: "",
          method: "POST",
          path: "",
          baseUrl: "",
          headers: "",
          enabled: true,
        });
        setServiceEndpointMode("create");
        setServiceAssignUserId("");

        const [endpoints, users] = await Promise.all([
          match.endpointsEnabled !== false
            ? api.listTenantServiceEndpoints(tenantId, serviceCode)
            : Promise.resolve([]),
          api.listTenantServiceUsers(tenantId, serviceCode),
        ]);
        if (!active) {
          return;
        }
        setServiceEndpoints(endpoints as TenantServiceEndpoint[]);
        setServiceUsers(users as TenantServiceUser[]);
        setError(null);
      } catch (err: any) {
        if (active) {
          setError(err.message || "Error cargando servicio");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [tenantId, serviceCode, canManagePolicies]);

  const handleSaveServiceConfig = async () => {
    if (!tenantId || !serviceCode) {
      return;
    }
    if (!serviceConfigDraft.providerId.trim()) {
      emitToast("Selecciona un provider.", "error");
      return;
    }
    if (!serviceConfigDraft.pricingId.trim()) {
      emitToast("Selecciona un pricing.", "error");
      return;
    }
    if (!serviceConfigDraft.policyId.trim()) {
      emitToast("Selecciona una política.", "error");
      return;
    }
    setServiceBusy(true);
    try {
      await api.updateTenantServiceConfig(tenantId, serviceCode, {
        status: serviceConfigDraft.status,
        apiBaseUrl: serviceConfigDraft.apiBaseUrl,
        systemPrompt: serviceConfigDraft.systemPrompt,
        providerId: serviceConfigDraft.providerId,
        pricingId: serviceConfigDraft.pricingId,
        policyId: serviceConfigDraft.policyId,
      });
      await refreshServiceSummary();
      emitToast("Configuración del servicio guardada.");
    } catch (err: any) {
      emitToast(err.message || "No se pudo guardar el servicio", "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const handleServiceRuntimeTest = async () => {
    if (!tenantId || !serviceCode) {
      return;
    }
    if (!hasTenantApiKey) {
      setServiceRuntimeError(
        "Necesitas una API key activa para ejecutar runtime.",
      );
      return;
    }
    const providerId =
      serviceConfigDraft.providerId || serviceRuntimeForm.providerId;
    if (!providerId.trim()) {
      setServiceRuntimeError("Provider es obligatorio.");
      return;
    }
    if (!serviceRuntimeForm.model.trim()) {
      setServiceRuntimeError("Modelo es obligatorio.");
      return;
    }
    let payload: Record<string, any> = {};
    try {
      payload = serviceRuntimeForm.payload
        ? JSON.parse(serviceRuntimeForm.payload)
        : {};
    } catch {
      setServiceRuntimeError("Payload debe ser JSON válido.");
      return;
    }
    try {
      setServiceRuntimeBusy(true);
      setServiceRuntimeError(null);
      const result = await api.executeRuntime(tenantId, {
        providerId: providerId.trim(),
        model: serviceRuntimeForm.model.trim(),
        payload,
        serviceCode,
      });
      setServiceRuntimeResult(result);
      emitToast("Runtime ejecutado");
    } catch (err: any) {
      setServiceRuntimeError(err.message || "Error ejecutando runtime");
    } finally {
      setServiceRuntimeBusy(false);
    }
  };

  const parseHeaders = (value: string) => {
    if (!value.trim()) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch (err) {
      emitToast("Headers debe ser un JSON válido.", "error");
      return undefined;
    }
  };

  const handleSaveEndpoint = async () => {
    if (!tenantId || !serviceCode) {
      return;
    }
    const headers = parseHeaders(serviceEndpointDraft.headers);
    if (headers === undefined) {
      return;
    }
    setServiceBusy(true);
    try {
      if (serviceEndpointMode === "edit") {
        await api.updateTenantServiceEndpoint(
          tenantId,
          serviceCode,
          serviceEndpointDraft.id,
          {
            slug: serviceEndpointDraft.slug,
            method: serviceEndpointDraft.method,
            path: serviceEndpointDraft.path,
            baseUrl: serviceEndpointDraft.baseUrl || null,
            headers,
            enabled: serviceEndpointDraft.enabled,
          },
        );
      } else {
        await api.createTenantServiceEndpoint(tenantId, serviceCode, {
          slug: serviceEndpointDraft.slug,
          method: serviceEndpointDraft.method,
          path: serviceEndpointDraft.path,
          baseUrl: serviceEndpointDraft.baseUrl || null,
          headers,
          enabled: serviceEndpointDraft.enabled,
        });
      }
      const endpoints = await api.listTenantServiceEndpoints(
        tenantId,
        serviceCode,
      );
      setServiceEndpoints(endpoints as TenantServiceEndpoint[]);
      setServiceEndpointDraft({
        id: "",
        slug: "",
        method: "POST",
        path: "",
        baseUrl: "",
        headers: "",
        enabled: true,
      });
      setServiceEndpointMode("create");
      emitToast("Endpoint guardado.");
    } catch (err: any) {
      emitToast(err.message || "No se pudo guardar el endpoint", "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const handleEditEndpoint = (endpoint: TenantServiceEndpoint) => {
    setServiceEndpointDraft({
      id: endpoint.id,
      slug: endpoint.slug,
      method: endpoint.method,
      path: endpoint.path,
      baseUrl: endpoint.baseUrl || "",
      headers: endpoint.headers
        ? JSON.stringify(endpoint.headers, null, 2)
        : "",
      enabled: endpoint.enabled,
    });
    setServiceEndpointMode("edit");
  };

  const handleDeleteEndpoint = async (endpoint: TenantServiceEndpoint) => {
    if (!tenantId || !serviceCode) {
      return;
    }
    const result = await Swal.fire({
      title: "¿Eliminar endpoint?",
      text: endpoint.slug,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) {
      return;
    }
    setServiceBusy(true);
    try {
      await api.deleteTenantServiceEndpoint(tenantId, serviceCode, endpoint.id);
      setServiceEndpoints((prev) =>
        prev.filter((item) => item.id !== endpoint.id),
      );
      emitToast("Endpoint eliminado.");
    } catch (err: any) {
      emitToast(err.message || "No se pudo eliminar el endpoint", "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const handleAssignServiceUser = async () => {
    if (!tenantId || !serviceCode || !serviceAssignUserId) {
      return;
    }
    setServiceBusy(true);
    try {
      await api.assignTenantServiceUser(tenantId, serviceCode, {
        userId: serviceAssignUserId,
      });
      const users = await api.listTenantServiceUsers(tenantId, serviceCode);
      setServiceUsers(users as TenantServiceUser[]);
      setServiceAssignUserId("");
      await refreshServiceSummary();
      emitToast("Usuario asignado.");
    } catch (err: any) {
      emitToast(err.message || "No se pudo asignar el usuario", "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const handleUpdateServiceUserStatus = async (
    assignment: TenantServiceUser,
    status: "active" | "suspended",
  ) => {
    if (!tenantId || !serviceCode) {
      return;
    }
    setServiceBusy(true);
    try {
      await api.updateTenantServiceUser(
        tenantId,
        serviceCode,
        assignment.userId,
        {
          status,
        },
      );
      const users = await api.listTenantServiceUsers(tenantId, serviceCode);
      setServiceUsers(users as TenantServiceUser[]);
      emitToast("Usuario actualizado.");
    } catch (err: any) {
      emitToast(err.message || "No se pudo actualizar el usuario", "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const handleRemoveServiceUser = async (assignment: TenantServiceUser) => {
    if (!tenantId || !serviceCode) {
      return;
    }
    const result = await Swal.fire({
      title: "¿Quitar acceso al servicio?",
      text: assignment.user.email,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Quitar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) {
      return;
    }
    setServiceBusy(true);
    try {
      await api.removeTenantServiceUser(
        tenantId,
        serviceCode,
        assignment.userId,
      );
      const users = await api.listTenantServiceUsers(tenantId, serviceCode);
      setServiceUsers(users as TenantServiceUser[]);
      await refreshServiceSummary();
      emitToast("Usuario removido.");
    } catch (err: any) {
      emitToast(err.message || "No se pudo quitar el usuario", "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    if (!tenantId) {
      return;
    }
    try {
      setChatBusy(true);
      const messages = await api.listChatMessages(tenantId, conversationId);
      setChatMessages(messages as ChatMessage[]);
      setActiveConversationId(conversationId);
    } catch (err: any) {
      setError(err.message || "Error cargando conversación");
    } finally {
      setChatBusy(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!tenantId) {
      return;
    }
    if (!canManageConversations) {
      return;
    }
    const result = await Swal.fire({
      title: "Eliminar conversación",
      text: "¿Eliminar esta conversación?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      setChatBusy(true);
      await api.deleteChatConversation(tenantId, conversationId);
      setChatConversations((prev) =>
        prev.filter((item) => item.id !== conversationId),
      );
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setChatMessages([]);
      }
      emitToast("Conversación eliminada");
    } catch (err: any) {
      setError(err.message || "Error eliminando conversación");
    } finally {
      setChatBusy(false);
    }
  };

  if (!tenantId || !serviceCode) {
    return (
      <PageWithDocs slug="tenant-services">
        <div className="muted">Selecciona un servicio para gestionarlo.</div>
      </PageWithDocs>
    );
  }

  return (
    <PageWithDocs slug="tenant-services">
      {error && <div className="error-banner">{error}</div>}
      <div className="card full-width">
        <div className="card-header">
          <div>
            <div className="eyebrow">Servicio adquirido</div>
            <h2>{service?.name || serviceCode}</h2>
            <p className="muted">{service?.description}</p>
          </div>
          <div className="row-actions">
            <Link className="btn" to={`/clients/${tenantId}`}>
              Volver al tenant
            </Link>
          </div>
        </div>
        {loading && <LoaderComponent label="Cargando servicio" />}
        {!loading && service && (
          <>
            <div className="row g-3 form-grid-13">
              <div className="col-12 col-md-4">
                <label>
                  Estado operativo
                  <select
                    className="form-select"
                    value={serviceConfigDraft.status}
                    onChange={(event) =>
                      setServiceConfigDraft((prev) => ({
                        ...prev,
                        status: event.target.value as "active" | "suspended",
                      }))
                    }
                    disabled={!canManageServices}
                  >
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                  </select>
                </label>
              </div>
              <div className="col-12">
                <label>
                  URL base de la API
                  <input
                    className="form-control"
                    value={serviceConfigDraft.apiBaseUrl}
                    onChange={(event) =>
                      setServiceConfigDraft((prev) => ({
                        ...prev,
                        apiBaseUrl: event.target.value,
                      }))
                    }
                    placeholder="https://api.cliente.com"
                    disabled={!canManageServices}
                  />
                </label>
              </div>
              <div className="col-12">
                <label>
                  <span className="label-with-tooltip">
                    Prompt de comportamiento (aplica a todo el servicio)
                    <InfoTooltip field="serviceSystemPrompt" />
                  </span>
                  <textarea
                    className="form-control"
                    value={serviceConfigDraft.systemPrompt}
                    onChange={(event) =>
                      setServiceConfigDraft((prev) => ({
                        ...prev,
                        systemPrompt: event.target.value,
                      }))
                    }
                    rows={20}
                    placeholder="Define el estilo del asistente, tono y reglas..."
                    disabled={!canManageServices}
                  />
                </label>
              </div>
              <div className="col-12 col-md-4">
                <label>
                  Provider
                  <select
                    className="form-select"
                    value={serviceConfigDraft.providerId}
                    onChange={(event) =>
                      setServiceConfigDraft((prev) => ({
                        ...prev,
                        providerId: event.target.value,
                      }))
                    }
                    disabled={!canManageServices}
                  >
                    <option value="" disabled>
                      Selecciona provider
                    </option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.displayName} · {provider.type}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="col-12 col-md-4">
                <label>
                  Pricing
                  <select
                    className="form-select"
                    value={serviceConfigDraft.pricingId}
                    onChange={(event) =>
                      setServiceConfigDraft((prev) => ({
                        ...prev,
                        pricingId: event.target.value,
                      }))
                    }
                    disabled={!canManageServices}
                  >
                    <option value="" disabled>
                      Selecciona pricing
                    </option>
                    {pricing.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.providerType} · {entry.model}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="col-12 col-md-4">
                <label>
                  Política
                  <select
                    className="form-select"
                    value={serviceConfigDraft.policyId}
                    onChange={(event) =>
                      setServiceConfigDraft((prev) => ({
                        ...prev,
                        policyId: event.target.value,
                      }))
                    }
                    disabled={!canManageServices}
                  >
                    <option value="" disabled>
                      Selecciona política
                    </option>
                    {policyCatalog.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.id.slice(0, 8)} · {entry.maxRequestsPerMinute}
                        /min
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button
                className="btn primary"
                onClick={handleSaveServiceConfig}
                disabled={
                  serviceBusy || !canManageServices || !canSaveServiceConfig
                }
              >
                Guardar configuración
              </button>
            </div>

            <div className="section-divider" />

            <h4>Prueba runtime del servicio</h4>
            {!hasTenantApiKey && (
              <div className="info-banner">
                Necesitas una API key activa para ejecutar el runtime.
              </div>
            )}
            <div className="row g-3 form-grid-13">
              <div className="col-12 col-md-4">
                <label>
                  Provider
                  <select
                    className="form-select"
                    value={
                      serviceConfigDraft.providerId ||
                      serviceRuntimeForm.providerId
                    }
                    onChange={(event) =>
                      setServiceRuntimeForm((prev) => ({
                        ...prev,
                        providerId: event.target.value,
                      }))
                    }
                    disabled={!hasTenantApiKey}
                  >
                    <option value="">Selecciona provider</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.displayName} · {provider.type}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="col-12 col-md-4">
                <label>
                  Modelo
                  <input
                    className="form-control"
                    value={serviceRuntimeForm.model}
                    onChange={(event) =>
                      setServiceRuntimeForm((prev) => ({
                        ...prev,
                        model: event.target.value,
                      }))
                    }
                    placeholder="gpt-4o-mini"
                    disabled={!hasTenantApiKey}
                  />
                </label>
              </div>
              <div className="col-12">
                <label>
                  Payload JSON
                  <textarea
                    className="form-control"
                    value={serviceRuntimeForm.payload}
                    onChange={(event) =>
                      setServiceRuntimeForm((prev) => ({
                        ...prev,
                        payload: event.target.value,
                      }))
                    }
                    rows={6}
                    placeholder='{"messages":[{"role":"user","content":"Hola"}]}'
                    disabled={!hasTenantApiKey}
                  />
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button
                className="btn primary"
                onClick={handleServiceRuntimeTest}
                disabled={serviceRuntimeBusy || !hasTenantApiKey}
              >
                Ejecutar runtime
              </button>
              {serviceRuntimeBusy && (
                <span className="muted">Ejecutando...</span>
              )}
            </div>
            {serviceRuntimeError && (
              <div className="error-banner">{serviceRuntimeError}</div>
            )}
            {serviceRuntimeResult && (
              <div className="code-block">
                <pre>{JSON.stringify(serviceRuntimeResult, null, 2)}</pre>
              </div>
            )}

            <div className="section-divider" />

            {service.endpointsEnabled !== false ? (
              <>
                <h4>Endpoints del servicio</h4>
                <p className="muted mb-4">
                  Es obligatorio crear endpoints para este servicio según su
                  configuración.
                </p>
                <div className="row g-3 form-grid-13">
                  <div className="col-12 col-md-4">
                    <label>
                      Slug
                      <input
                        className="form-control"
                        value={serviceEndpointDraft.slug}
                        onChange={(event) =>
                          setServiceEndpointDraft((prev) => ({
                            ...prev,
                            slug: event.target.value,
                          }))
                        }
                        placeholder="send-message"
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label>
                      Método
                      <select
                        className="form-select"
                        value={serviceEndpointDraft.method}
                        onChange={(event) =>
                          setServiceEndpointDraft((prev) => ({
                            ...prev,
                            method: event.target.value,
                          }))
                        }
                      >
                        {["GET", "POST", "PUT", "PATCH", "DELETE"].map(
                          (method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label>
                      Path
                      <input
                        className="form-control"
                        value={serviceEndpointDraft.path}
                        onChange={(event) =>
                          setServiceEndpointDraft((prev) => ({
                            ...prev,
                            path: event.target.value,
                          }))
                        }
                        placeholder="/chat/send"
                      />
                    </label>
                  </div>
                  <div className="col-12 col-md-4">
                    <label>
                      <input
                        type="checkbox"
                        checked={serviceEndpointDraft.enabled}
                        onChange={(event) =>
                          setServiceEndpointDraft((prev) => ({
                            ...prev,
                            enabled: event.target.checked,
                          }))
                        }
                      />{" "}
                      Activo
                    </label>
                  </div>
                  <div className="col-12">
                    <label>
                      Headers JSON (opcional)
                      <textarea
                        className="form-control"
                        value={serviceEndpointDraft.headers}
                        onChange={(event) =>
                          setServiceEndpointDraft((prev) => ({
                            ...prev,
                            headers: event.target.value,
                          }))
                        }
                        placeholder='{"Authorization": "Bearer ..."}'
                      />
                    </label>
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    className="btn primary"
                    onClick={handleSaveEndpoint}
                    disabled={
                      serviceBusy ||
                      !serviceEndpointDraft.slug.trim() ||
                      !serviceEndpointDraft.path.trim()
                    }
                  >
                    {serviceEndpointMode === "edit"
                      ? "Actualizar endpoint"
                      : "Crear endpoint"}
                  </button>

                  {serviceEndpointMode === "edit" && (
                    <button
                      className="btn"
                      onClick={() => {
                        setServiceEndpointMode("create");
                        setServiceEndpointDraft({
                          id: "",
                          slug: "",
                          method: "POST",
                          path: "",
                          baseUrl: "",
                          headers: "",
                          enabled: true,
                        });
                      }}
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>
                <hr />
                <DataTable
                  columns={[
                    { key: "slug", label: "Slug", sortable: true },
                    { key: "method", label: "Método", sortable: true },
                    { key: "path", label: "Path", sortable: true },
                    {
                      key: "enabled",
                      label: "Estado",
                      sortable: true,
                      render: (row: TenantServiceEndpoint) => (
                        <StatusBadgeIcon status={row.enabled} />
                      ),
                    },
                    {
                      key: "actions",
                      label: "Acciones",
                      render: (row: TenantServiceEndpoint) => (
                        <div className="row-actions">
                          <button
                            className="link"
                            onClick={() => handleEditEndpoint(row)}
                          >
                            Editar
                          </button>
                          <button
                            className="link danger"
                            onClick={() => handleDeleteEndpoint(row)}
                          >
                            Eliminar
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  data={serviceEndpoints}
                  getRowId={(row) => row.id}
                  pageSize={5}
                  filterKeys={["slug", "method", "path"]}
                />
                {serviceEndpoints.length === 0 && (
                  <div className="muted">Sin endpoints configurados.</div>
                )}
              </>
            ) : (
              <div className="muted">
                Este servicio no requiere endpoints configurables.
              </div>
            )}

            <div className="section-divider" />

            <h4>Datos para app de terceros</h4>
            <p className="muted">
              Resumen para que el desarrollador configure el chatbot en la app
              externa.
            </p>
            <div className="kv-grid">
              <div className="kv-item">
                <span className="kv-label">URL de la API</span>
                <span className="kv-value">
                  {serviceConfigDraft.apiBaseUrl ||
                    service?.apiBaseUrl ||
                    apiBaseUrl}
                </span>
              </div>
              <div className="kv-item">
                <span className="kv-label">API key</span>
                <span className="kv-value">
                  {activeApiKey
                    ? "API key activa (no visible)"
                    : "No disponible"}
                </span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Provider ID</span>
                <span className="kv-value">{serviceProviderId || "—"}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Model</span>
                <span className="kv-value">{serviceModel || "—"}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Tenant ID</span>
                <span className="kv-value">{tenantId || "—"}</span>
              </div>
              <div className="kv-item">
                <span className="kv-label">Chat endpoint</span>
                <span className="kv-value">persisted</span>
              </div>
            </div>
            {service.endpointsEnabled !== false ? (
              serviceEndpoints.length > 0 ? (
                <div>
                  <div className="muted">
                    Endpoints configurados (se listan con su método).
                  </div>
                  <div className="endpoint-list">
                    {serviceEndpoints.map((endpoint) => (
                      <div className="endpoint-item" key={endpoint.id}>
                        <span className="endpoint-method">
                          {endpoint.method}
                        </span>
                        <span className="endpoint-path">{endpoint.path}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="info-banner">
                  Este servicio aún no tiene endpoints configurados.
                </div>
              )
            ) : (
              <div className="muted">Este servicio no requiere endpoints.</div>
            )}

            <div className="section-divider" />

            <h4>Usuarios asignados</h4>
            <div className="row g-3 form-grid-13">
              <div className="col-12 col-md-4">
                <label>
                  Asignar usuario existente
                  <select
                    className="form-select"
                    value={serviceAssignUserId}
                    onChange={(event) =>
                      setServiceAssignUserId(event.target.value)
                    }
                    disabled={!canManageChatUsers}
                  >
                    <option value="">Selecciona un usuario</option>
                    {availableServiceUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="col-12 col-md-4">
                <div className="form-actions">
                  <button
                    className="btn primary"
                    onClick={handleAssignServiceUser}
                    disabled={
                      serviceBusy || !serviceAssignUserId || !canManageChatUsers
                    }
                  >
                    Asignar
                  </button>
                </div>
              </div>
            </div>

            <DataTable
              columns={[
                {
                  key: "name",
                  label: "Usuario",
                  sortable: true,
                  render: (row: any) => row.name || row.email,
                },
                { key: "email", label: "Email", sortable: true },
                {
                  key: "status",
                  label: "Estado",
                  sortable: true,
                  render: (row: any) => <StatusBadgeIcon status={row.status} />,
                },
                {
                  key: "actions",
                  label: "Acciones",
                  render: (row: any) => (
                    <div className="row-actions">
                      <button
                        className="link"
                        onClick={() =>
                          handleUpdateServiceUserStatus(
                            row,
                            row.status === "active" ? "suspended" : "active",
                          )
                        }
                        disabled={!canManageChatUsers}
                      >
                        {row.status === "active" ? "Suspender" : "Activar"}
                      </button>
                      <button
                        className="link danger"
                        onClick={() => handleRemoveServiceUser(row)}
                        disabled={!canManageChatUsers}
                      >
                        Quitar
                      </button>
                    </div>
                  ),
                },
              ]}
              data={serviceUserRows as any[]}
              getRowId={(row: any) => row.userId}
              pageSize={6}
              filterKeys={["name", "email", "status"]}
            />
            {serviceUserRows.length === 0 && (
              <div className="muted">Sin usuarios asignados.</div>
            )}

            <div className="section-divider" />

            <h4>Conversaciones del servicio</h4>
            <p className="muted mb-4">
              Histórico de conversaciones asociadas a este servicio.
            </p>
            <DataTable
              columns={[
                {
                  key: "title",
                  label: "Título",
                  sortable: true,
                  render: (conversation: ChatConversation) =>
                    conversation.title || "Sin título",
                },
                {
                  key: "userId",
                  label: "Usuario",
                  sortable: true,
                  render: (conversation: ChatConversation) =>
                    chatUsers.find((user) => user.id === conversation.userId)
                      ?.email || conversation.userId,
                },
                { key: "model", label: "Modelo", sortable: true },
                {
                  key: "createdAt",
                  label: "Creado",
                  sortable: true,
                  render: (conversation: ChatConversation) =>
                    new Date(conversation.createdAt).toLocaleString(),
                },
                {
                  key: "actions",
                  label: "Acciones",
                  render: (conversation: ChatConversation) => (
                    <div className="row-actions">
                      <button
                        className="link"
                        onClick={() =>
                          handleSelectConversation(conversation.id)
                        }
                        disabled={chatBusy}
                      >
                        Ver mensajes
                      </button>
                      {canManageConversations && (
                        <button
                          className="link danger"
                          onClick={() =>
                            handleDeleteConversation(conversation.id)
                          }
                          disabled={chatBusy}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
              data={chatConversations}
              getRowId={(conversation) => conversation.id}
              pageSize={6}
              filterKeys={["title", "userId", "model"]}
            />
            {chatConversations.length === 0 && (
              <div className="muted">Sin conversaciones.</div>
            )}
            {activeConversationId && (
              <div className="mini-list">
                {chatMessages.map((message) => (
                  <div className="mini-row" key={message.id}>
                    <span className="muted">{message.role}</span>
                    <span>{message.content}</span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                ))}
                {chatMessages.length === 0 && (
                  <div className="muted">Sin mensajes.</div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageWithDocs>
  );
}
