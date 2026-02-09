import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { Chart, Sparkline } from "../components/charts/Charts";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { PageWithDocs } from "../components/PageWithDocs";
import { useAuth } from "../auth";
import { useDashboard } from "../dashboard";
import { emitToast } from "../toast";
import Swal from "sweetalert2";
import Multiselect from "react-bootstrap-multiselect";
import type {
  ApiKeySummary,
  AuditEvent,
  ChatConversation,
  ChatMessage,
  ChatUserSummary,
  Policy,
  Provider,
  PricingEntry,
  ServiceCatalogItem,
  SubscriptionSummary,
  Tenant,
  UsageEvent,
  UsageSummary,
} from "../types";
import { buildDailyUsage } from "../utils/chartData";
import { formatEur, formatUsdWithEur } from "../utils/currency";

export function ClientSummaryPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { role, tenantId: authTenantId } = useAuth();
  const isTenant = role === "tenant";
  const canEditTenant = role === "admin" || role === "tenant";
  const canManageChatUsers = role === "admin" || role === "tenant";
  const canManageSubscription = role === "admin" || role === "tenant";
  const canManagePricing = role === "admin";
  const canManageApiKeys = role === "admin";
  const canManageConversations = role === "admin";
  const { selectedTenantId, setSelectedTenantId } = useDashboard();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  type TenantFormState = {
    name: string;
    billingEmail: string;
    companyName: string;
    contactName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    postalCode: string;
    country: string;
    billingAddressLine1: string;
    billingAddressLine2: string;
    billingCity: string;
    billingPostalCode: string;
    billingCountry: string;
    taxId: string;
    website: string;
  };
  type TenantFieldKey = keyof TenantFormState;
  const [editingField, setEditingField] = useState<TenantFieldKey | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const skipBlurConfirmRef = useRef(false);
  const [tenantForm, setTenantForm] = useState<TenantFormState>({
    name: "",
    billingEmail: "",
    companyName: "",
    contactName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "",
    billingAddressLine1: "",
    billingAddressLine2: "",
    billingCity: "",
    billingPostalCode: "",
    billingCountry: "",
    taxId: "",
    website: "",
  });
  const [tenantSaving, setTenantSaving] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [pricing, setPricing] = useState<PricingEntry[]>([]);
  const [pricingSelection, setPricingSelection] = useState<string[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUserSummary[]>([]);
  const [chatConversations, setChatConversations] = useState<
    ChatConversation[]
  >([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [newChatUser, setNewChatUser] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [chatUserModalOpen, setChatUserModalOpen] = useState(false);
  const [chatUserMode, setChatUserMode] = useState<"create" | "edit">("create");
  const [editingChatUserId, setEditingChatUserId] = useState<string | null>(
    null,
  );
  const [chatBusy, setChatBusy] = useState(false);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [usageEvents, setUsageEvents] = useState<UsageEvent[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>(
    [],
  );
  const [subscriptionSummary, setSubscriptionSummary] =
    useState<SubscriptionSummary | null>(null);
  const [subscriptionForm, setSubscriptionForm] = useState({
    period: "monthly" as "monthly" | "annual",
    basePriceEur: 49,
    serviceCodes: [] as string[],
    cancelAtPeriodEnd: false,
  });
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [subscriptionReviewOpen, setSubscriptionReviewOpen] = useState(false);
  const [serviceDoc, setServiceDoc] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dailyUsage = useMemo(
    () => buildDailyUsage(usageEvents, 7),
    [usageEvents],
  );
  const usageTrendOption = useMemo(
    () => ({
      tooltip: { trigger: "axis" },
      legend: { bottom: 0, textStyle: { color: "#6d6b67", fontSize: 12 } },
      grid: { left: 24, right: 24, top: 24, bottom: 48 },
      xAxis: {
        type: "category",
        data: dailyUsage.labels,
        axisLabel: { color: "#6d6b67" },
      },
      yAxis: [
        { type: "value", axisLabel: { color: "#6d6b67" } },
        {
          type: "value",
          axisLabel: { color: "#6d6b67", formatter: "${value}" },
        },
      ],
      series: [
        {
          name: "Tokens",
          type: "line",
          data: dailyUsage.tokens,
          smooth: true,
          symbol: "none",
          lineStyle: { color: "#1f6f78", width: 3 },
        },
        {
          name: "Coste",
          type: "line",
          yAxisIndex: 1,
          data: dailyUsage.cost.map((value) => Number(value.toFixed(2))),
          smooth: true,
          symbol: "none",
          lineStyle: { color: "#d8512a", width: 3 },
        },
      ],
    }),
    [dailyUsage],
  );

  const subscription = subscriptionSummary?.subscription || null;
  const subscriptionServices = subscriptionSummary?.services || [];
  const subscriptionServiceMap = useMemo(
    () => new Map(subscriptionServices.map((item) => [item.serviceCode, item])),
    [subscriptionServices],
  );
  const visibleServices = useMemo(
    () => serviceCatalog.filter((service) => service.enabled),
    [serviceCatalog],
  );
  const selectedServices = useMemo(
    () =>
      visibleServices.filter((service) =>
        subscriptionForm.serviceCodes.includes(service.code),
      ),
    [visibleServices, subscriptionForm.serviceCodes],
  );
  const subscriptionTotalEur = useMemo(() => {
    const servicesTotal = selectedServices.reduce((sum, service) => {
      const price =
        subscriptionForm.period === "annual"
          ? service.priceAnnualEur
          : service.priceMonthlyEur;
      return sum + Number(price || 0);
    }, 0);
    return Number(subscriptionForm.basePriceEur || 0) + servicesTotal;
  }, [
    selectedServices,
    subscriptionForm.period,
    subscriptionForm.basePriceEur,
  ]);

  const canReviewSubscription =
    Boolean(tenant?.billingEmail) &&
    Number(subscriptionForm.basePriceEur || 0) > 0 &&
    selectedServices.length > 0 &&
    !subscriptionBusy;
  const activeServiceCodes = useMemo(
    () =>
      new Set(
        subscriptionServices
          .filter(
            (item) =>
              item.status === "active" || item.status === "pending_removal",
          )
          .map((item) => item.serviceCode),
      ),
    [subscriptionServices],
  );

  const serviceOption = useMemo(() => {
    const data = [
      {
        name: "Chatbot genérico",
        value: activeServiceCodes.has("chat_generic") ? 1 : 0,
      },
      {
        name: "Chatbot OCR",
        value: activeServiceCodes.has("chat_ocr") ? 1 : 0,
      },
      {
        name: "Chatbot SQL",
        value: activeServiceCodes.has("chat_sql") ? 1 : 0,
      },
    ];
    const hasEnabled = data.some((item) => item.value > 0);
    const seriesData = hasEnabled
      ? data
      : [{ name: "Sin servicios", value: 1 }];
    return {
      tooltip: { trigger: "item" },
      legend: { bottom: 0, textStyle: { color: "#6d6b67", fontSize: 12 } },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: { borderColor: "#fff", borderWidth: 2 },
          label: { show: false },
          data: seriesData,
        },
      ],
    };
  }, [activeServiceCodes]);

  const pricingOptions = useMemo(
    () =>
      pricing.map((entry) => ({
        value: entry.id,
        label: `${entry.providerType} · ${entry.model} · ${formatUsdWithEur(
          entry.inputCostPer1k,
        )}/${formatUsdWithEur(entry.outputCostPer1k)}`,
        selected: pricingSelection.includes(entry.id),
      })),
    [pricing, pricingSelection],
  );

  const handlePricingChange = (option: any, checked: boolean) => {
    if (!canManagePricing) {
      return;
    }
    if (!option || typeof option.val !== "function") {
      return;
    }
    const value = option.val();
    const values = Array.isArray(value) ? value : [value];
    setPricingSelection((prev) => {
      let next = [...prev];
      values.forEach((val) => {
        if (!val) {
          return;
        }
        if (checked) {
          if (!next.includes(val)) {
            next.push(val);
          }
        } else {
          next = next.filter((id) => id !== val);
        }
      });
      return next;
    });
  };

  useEffect(() => {
    if (!tenantId) {
      return;
    }
    const load = async () => {
      try {
        const [
          tenantList,
          providerList,
          policyData,
          pricingList,
          apiKeyList,
          summary,
          events,
          audit,
          catalogList,
          subscriptionData,
          pricingAssignment,
          chatUsersList,
          chatConversationsList,
        ] = await Promise.all([
          api.getTenants(),
          api.getProviders(tenantId),
          api.getPolicy(tenantId),
          api.getPricing(),
          api.listApiKeys(),
          api.getUsageSummary(tenantId),
          api.getUsageEvents(tenantId, 25),
          api.getAudit(25, tenantId),
          api.listServiceCatalog(),
          api.getTenantSubscription(tenantId),
          api.getTenantPricing(tenantId),
          api.listChatUsers(tenantId),
          api.listChatConversations(tenantId),
        ]);

        setTenant(
          tenantList.find((item: Tenant) => item.id === tenantId) || null,
        );
        setProviders(providerList);
        setPolicy(policyData || null);
        setPricing(pricingList);
        setPricingSelection(pricingAssignment?.pricingIds || []);
        setApiKeys(
          (apiKeyList as ApiKeySummary[]).filter(
            (item) => item.tenantId === tenantId,
          ),
        );
        setChatUsers(chatUsersList as ChatUserSummary[]);
        setChatConversations(chatConversationsList as ChatConversation[]);
        setChatMessages([]);
        setActiveConversationId(null);
        setUsageSummary(summary);
        setUsageEvents(events);
        setAuditEvents(audit);
        setServiceCatalog(catalogList as ServiceCatalogItem[]);
        setSubscriptionSummary(subscriptionData as SubscriptionSummary);
        if (subscriptionData?.subscription) {
          setSubscriptionForm({
            period: subscriptionData.subscription.period,
            basePriceEur: Number(
              subscriptionData.subscription.basePriceEur || 0,
            ),
            serviceCodes: (subscriptionData.services || [])
              .filter((item: any) => item.status !== "pending_removal")
              .map((item: any) => item.serviceCode),
            cancelAtPeriodEnd: Boolean(
              subscriptionData.subscription.cancelAtPeriodEnd,
            ),
          });
        } else {
          setSubscriptionForm((prev) => ({ ...prev, serviceCodes: [] }));
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || "Error cargando resumen de cliente");
      }
    };
    load();
  }, [tenantId]);

  useEffect(() => {
    if (!tenant) {
      return;
    }
    setTenantForm({
      name: tenant.name || "",
      billingEmail: tenant.billingEmail || "",
      companyName: tenant.companyName || "",
      contactName: tenant.contactName || "",
      phone: tenant.phone || "",
      addressLine1: tenant.addressLine1 || "",
      addressLine2: tenant.addressLine2 || "",
      city: tenant.city || "",
      postalCode: tenant.postalCode || "",
      country: tenant.country || "",
      billingAddressLine1: tenant.billingAddressLine1 || "",
      billingAddressLine2: tenant.billingAddressLine2 || "",
      billingCity: tenant.billingCity || "",
      billingPostalCode: tenant.billingPostalCode || "",
      billingCountry: tenant.billingCountry || "",
      taxId: tenant.taxId || "",
      website: tenant.website || "",
    });
  }, [tenant]);

  useEffect(() => {
    if (!selectedTenantId || !tenantId) {
      return;
    }
    if (selectedTenantId !== tenantId) {
      navigate(`/clients/${selectedTenantId}`, { replace: true });
    }
  }, [selectedTenantId, tenantId, navigate]);

  useEffect(() => {
    if (role !== "tenant" || !authTenantId || !tenantId) {
      return;
    }
    if (tenantId !== authTenantId) {
      navigate(`/clients/${authTenantId}`, { replace: true });
    }
  }, [role, authTenantId, tenantId, navigate]);

  useEffect(() => {
    if (!tenantId) {
      return;
    }
    if (selectedTenantId !== tenantId) {
      setSelectedTenantId(tenantId);
    }
  }, [tenantId, selectedTenantId, setSelectedTenantId]);

  const handleSaveSubscription = async () => {
    if (!tenantId) {
      return;
    }
    if (subscription) {
      const result = await Swal.fire({
        title: "Actualizar suscripción",
        text: "¿Guardar los cambios de la suscripción?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Guardar",
        cancelButtonText: "Cancelar",
      });
      if (!result.isConfirmed) {
        return;
      }
    }
    try {
      setSubscriptionBusy(true);
      const currentCodes = new Set(
        subscriptionServices.map((item) => item.serviceCode),
      );
      const nextCodes = new Set(subscriptionForm.serviceCodes);
      const removeServiceCodes = Array.from(currentCodes).filter(
        (code) => !nextCodes.has(code),
      );
      const payload = {
        period: subscriptionForm.period,
        basePriceEur: Number(subscriptionForm.basePriceEur || 0),
        serviceCodes: subscriptionForm.serviceCodes,
        cancelAtPeriodEnd: subscriptionForm.cancelAtPeriodEnd,
        ...(removeServiceCodes.length > 0 ? { removeServiceCodes } : {}),
      };
      const updated = subscription
        ? await api.updateTenantSubscription(tenantId, payload)
        : await api.createTenantSubscription(tenantId, payload);
      setSubscriptionSummary(updated as SubscriptionSummary);
      setSubscriptionForm({
        period: updated.subscription.period,
        basePriceEur: Number(updated.subscription.basePriceEur || 0),
        serviceCodes: (updated.services || [])
          .filter((item: any) => item.status !== "pending_removal")
          .map((item: any) => item.serviceCode),
        cancelAtPeriodEnd: Boolean(updated.subscription.cancelAtPeriodEnd),
      });
      emitToast(
        subscription ? "Suscripción actualizada" : "Suscripción creada",
      );
    } catch (err: any) {
      setError(err.message || "Error guardando suscripción");
    } finally {
      setSubscriptionBusy(false);
    }
  };

  const handleServiceToggle = async (
    service: ServiceCatalogItem,
    checked: boolean,
  ) => {
    if (!canManageSubscription) {
      return;
    }
    const action = checked ? "Activar servicio" : "Desactivar servicio";
    const message = checked
      ? "Se añadirá el servicio y quedará pendiente hasta la próxima renovación."
      : "Se dará de baja el servicio y no se cobrará en la próxima renovación.";
    const result = await Swal.fire({
      title: action,
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) {
      return;
    }
    setSubscriptionForm((prev) => ({
      ...prev,
      serviceCodes: checked
        ? [...prev.serviceCodes, service.code]
        : prev.serviceCodes.filter((code) => code !== service.code),
    }));
  };

  const buildTenantPayload = (formState: typeof tenantForm) => {
    const base = {
      name: formState.name.trim(),
      billingEmail: formState.billingEmail.trim() || null,
      companyName: formState.companyName.trim() || null,
      contactName: formState.contactName.trim() || null,
      phone: formState.phone.trim() || null,
      addressLine1: formState.addressLine1.trim() || null,
      addressLine2: formState.addressLine2.trim() || null,
      city: formState.city.trim() || null,
      postalCode: formState.postalCode.trim() || null,
      country: formState.country.trim() || null,
      billingAddressLine1: formState.billingAddressLine1.trim() || null,
      billingAddressLine2: formState.billingAddressLine2.trim() || null,
      billingCity: formState.billingCity.trim() || null,
      billingPostalCode: formState.billingPostalCode.trim() || null,
      billingCountry: formState.billingCountry.trim() || null,
      website: formState.website.trim() || null,
    } as Record<string, any>;
    if (role === "admin") {
      base.taxId = formState.taxId.trim() || null;
    }
    return base;
  };

  const handleSaveTenant = async (nextForm: typeof tenantForm) => {
    if (!tenantId || !nextForm.name.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }
    try {
      setTenantSaving(true);
      const payload = buildTenantPayload(nextForm);
      const updated =
        role === "tenant"
          ? await api.updateTenantSelf(payload)
          : await api.updateTenant(tenantId, payload);
      setTenant(updated as Tenant);
      setTenantForm((prev) => ({ ...prev, ...nextForm }));
      emitToast("Datos de cliente actualizados");
    } catch (err: any) {
      setError(err.message || "Error guardando datos del cliente");
      throw err;
    } finally {
      setTenantSaving(false);
    }
  };

  const startEditField = (field: TenantFieldKey, value: string) => {
    if (!canEditTenant) {
      return;
    }
    if (tenantSaving) {
      return;
    }
    setEditingField(field);
    setEditingDraft(value);
  };

  const cancelEditField = () => {
    setEditingField(null);
    setEditingDraft("");
  };

  const saveEditField = async () => {
    if (!editingField) {
      return;
    }
    const previousValue = tenantForm[editingField] ?? "";
    if (editingDraft.trim() === String(previousValue || "").trim()) {
      cancelEditField();
      return;
    }
    const result = await Swal.fire({
      title: "Confirmar cambios",
      text: "¿Guardar cambios en este campo?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) {
      cancelEditField();
      return;
    }
    const nextForm = { ...tenantForm, [editingField]: editingDraft };
    try {
      await handleSaveTenant(nextForm);
      setEditingField(null);
      setEditingDraft("");
    } catch {
      // keep editing state so the user can adjust
    }
  };

  const renderEditableRow = (
    label: string,
    field: TenantFieldKey,
    displayValue: string,
    placeholder?: string,
    type: string = "text",
  ) => {
    const canEditField =
      canEditTenant && !(role === "tenant" && field === "taxId");
    if (!canEditField) {
      return (
        <div className="mini-row" key={field}>
          <span>{label}</span>
          <span>{displayValue || "-"}</span>
        </div>
      );
    }
    const isEditing = editingField === field;
    return (
      <div className="mini-row" key={field}>
        <span>{label}</span>
        {isEditing ? (
          <input
            autoFocus
            value={editingDraft}
            onChange={(event) => setEditingDraft(event.target.value)}
            onBlur={() => {
              if (skipBlurConfirmRef.current) {
                skipBlurConfirmRef.current = false;
                return;
              }
              void saveEditField();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                skipBlurConfirmRef.current = true;
                void saveEditField();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                cancelEditField();
              }
            }}
            placeholder={placeholder}
            type={type}
            disabled={tenantSaving}
          />
        ) : (
          <div
            className="inline-edit"
            onClick={() => startEditField(field, tenantForm[field] || "")}
            onDoubleClick={() => startEditField(field, tenantForm[field] || "")}
          >
            <span>{displayValue || "-"}</span>
            <button
              className="inline-edit-btn"
              type="button"
              aria-label={`Editar ${label}`}
              onClick={() => startEditField(field, tenantForm[field] || "")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l8.06-8.06.92.92L5.92 19.58zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 1 0-1.41 1.41l2.34 2.34c.39.39 1.02.39 1.41 0z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleCancelSubscription = async (mode: "period" | "now") => {
    if (!tenantId || !subscription) {
      return;
    }
    const result = await Swal.fire({
      title: "Confirmar suscripción",
      text:
        mode === "now"
          ? "¿Dar de baja inmediata a esta suscripción?"
          : "¿Cancelar al final del periodo actual?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      setSubscriptionBusy(true);
      const payload =
        mode === "now"
          ? { status: "cancelled", cancelAtPeriodEnd: false }
          : { cancelAtPeriodEnd: true };
      const updated = await api.updateTenantSubscription(tenantId, payload);
      setSubscriptionSummary(updated as SubscriptionSummary);
      setSubscriptionForm({
        period: updated.subscription.period,
        basePriceEur: Number(updated.subscription.basePriceEur || 0),
        serviceCodes: (updated.services || [])
          .filter((item: any) => item.status !== "pending_removal")
          .map((item: any) => item.serviceCode),
        cancelAtPeriodEnd: Boolean(updated.subscription.cancelAtPeriodEnd),
      });
      emitToast("Suscripción actualizada");
    } catch (err: any) {
      setError(err.message || "Error actualizando suscripción");
    } finally {
      setSubscriptionBusy(false);
    }
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      emitToast(`${label} copiado`);
    } catch (err) {
      emitToast("No se pudo copiar", "error");
    }
  };

  const handleRotateKey = async (id: string) => {
    try {
      const rotated = await api.rotateApiKey(id);
      if (rotated?.apiKey) {
        await navigator.clipboard.writeText(rotated.apiKey);
        emitToast("API key regenerada y copiada");
      }
      const list = await api.listApiKeys();
      setApiKeys(
        (list as ApiKeySummary[]).filter((item) => item.tenantId === tenantId),
      );
    } catch (err: any) {
      setError(err.message || "Error regenerando API key");
    }
  };

  const handleSavePricing = async () => {
    if (!tenantId) {
      return;
    }
    try {
      setSaving(true);
      const updated = await api.updateTenantPricing(tenantId, {
        pricingIds: pricingSelection,
      });
      setPricingSelection(updated.pricingIds || []);
    } catch (err: any) {
      setError(err.message || "Error guardando pricing");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateChatUser = async () => {
    if (
      !tenantId ||
      !newChatUser.email.trim() ||
      !newChatUser.password.trim()
    ) {
      return;
    }
    try {
      setChatBusy(true);
      const created = await api.createChatUser(tenantId, {
        email: newChatUser.email.trim(),
        name: newChatUser.name.trim() || undefined,
        password: newChatUser.password,
      });
      setChatUsers((prev) => [created as ChatUserSummary, ...prev]);
      setNewChatUser({ name: "", email: "", password: "" });
      setChatUserModalOpen(false);
      emitToast("Usuario de chat creado");
    } catch (err: any) {
      setError(err.message || "Error creando usuario de chat");
    } finally {
      setChatBusy(false);
    }
  };

  const handleUpdateChatUser = async (
    id: string,
    status: "active" | "disabled",
  ) => {
    if (!tenantId) {
      return;
    }
    try {
      setChatBusy(true);
      const updated = await api.updateChatUser(tenantId, id, { status });
      setChatUsers((prev) =>
        prev.map((user) => (user.id === id ? updated : user)),
      );
      emitToast("Usuario actualizado");
    } catch (err: any) {
      setError(err.message || "Error actualizando usuario");
    } finally {
      setChatBusy(false);
    }
  };

  const handleDisableChatUser = async (
    id: string,
    nextStatus: "active" | "disabled",
  ) => {
    if (!canManageChatUsers) {
      return;
    }
    const result = await Swal.fire({
      title: "Confirmar acción",
      text:
        nextStatus === "disabled"
          ? "¿Desactivar este usuario de chat?"
          : "¿Activar este usuario de chat?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) {
      return;
    }
    await handleUpdateChatUser(id, nextStatus);
  };

  const handleDeleteChatUser = async (id: string) => {
    if (!tenantId) {
      return;
    }
    if (!canManageChatUsers) {
      return;
    }
    const result = await Swal.fire({
      title: "Eliminar usuario",
      text: "¿Eliminar este usuario de chat?",
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
      await api.deleteChatUser(tenantId, id);
      setChatUsers((prev) => prev.filter((user) => user.id !== id));
      emitToast("Usuario eliminado");
    } catch (err: any) {
      setError(err.message || "Error eliminando usuario");
    } finally {
      setChatBusy(false);
    }
  };

  const openCreateChatUser = () => {
    if (!canManageChatUsers) {
      return;
    }
    setChatUserMode("create");
    setEditingChatUserId(null);
    setNewChatUser({ name: "", email: "", password: "" });
    setChatUserModalOpen(true);
  };

  const openEditChatUser = (user: ChatUserSummary) => {
    if (!canManageChatUsers) {
      return;
    }
    setChatUserMode("edit");
    setEditingChatUserId(user.id);
    setNewChatUser({ name: user.name || "", email: user.email, password: "" });
    setChatUserModalOpen(true);
  };

  const handleSaveChatUser = async () => {
    if (!tenantId) {
      return;
    }
    const result = await Swal.fire({
      title: chatUserMode === "create" ? "Crear usuario" : "Guardar cambios",
      text:
        chatUserMode === "create"
          ? "¿Crear este usuario de chat?"
          : "¿Guardar cambios en este usuario?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) {
      return;
    }
    if (chatUserMode === "create") {
      await handleCreateChatUser();
      return;
    }
    if (!editingChatUserId) {
      return;
    }
    try {
      setChatBusy(true);
      const payload: Record<string, string> = {
        email: newChatUser.email.trim(),
        name: newChatUser.name.trim(),
      };
      if (newChatUser.password.trim()) {
        payload.password = newChatUser.password;
      }
      const updated = await api.updateChatUser(
        tenantId,
        editingChatUserId,
        payload,
      );
      setChatUsers((prev) =>
        prev.map((user) => (user.id === editingChatUserId ? updated : user)),
      );
      setChatUserModalOpen(false);
      emitToast("Usuario actualizado");
    } catch (err: any) {
      setError(err.message || "Error actualizando usuario");
    } finally {
      setChatBusy(false);
    }
  };

  const chatUserColumns: DataTableColumn<ChatUserSummary>[] = [
    {
      key: "name",
      label: "Usuario",
      sortable: true,
      render: (user) => user.name || user.email,
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "status",
      label: "Estado",
      sortable: true,
      render: (user) => (
        <span className={`status ${user.status}`}>{user.status}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Creado",
      sortable: true,
      render: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
    ...(canManageChatUsers
      ? [
          {
            key: "actions",
            label: "Acciones",
            render: (user: ChatUserSummary) => (
              <div className="icon-actions">
                <button
                  type="button"
                  className="icon-button"
                  title="Editar"
                  onClick={() => openEditChatUser(user)}
                  disabled={chatBusy}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="icon-button danger"
                  title={user.status === "active" ? "Desactivar" : "Activar"}
                  onClick={() =>
                    handleDisableChatUser(
                      user.id,
                      user.status === "active" ? "disabled" : "active",
                    )
                  }
                  disabled={chatBusy}
                >
                  {user.status === "active" ? "⏸" : "▶"}
                </button>
                <button
                  type="button"
                  className="icon-button danger"
                  title="Eliminar"
                  onClick={() => handleDeleteChatUser(user.id)}
                  disabled={chatBusy}
                >
                  🗑
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

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

  if (!tenantId) {
    return (
      <PageWithDocs slug="tenants">
        <div className="muted">Selecciona un tenant para ver el resumen.</div>
      </PageWithDocs>
    );
  }

  return (
    <PageWithDocs slug="tenants">
      <section className="masonry">
        {error && <div className="error-banner">{error}</div>}

        <div className="card">
          <div className="card-header">
            <div>
              <h2>Resumen del cliente</h2>
              <p className="muted">
                Vista general de configuración, uso y auditoría.
              </p>
            </div>
            <div className="pill-row">
              <a className="btn" href="#providers">
                Providers
              </a>
              {/* <a className="btn" href="#policies">
                Políticas
              </a> */}
              <a className="btn" href="#pricing">
                Pricing
              </a>
            </div>
          </div>
          <div className="mini-list">
            <div className="mini-row">
              <span>ID</span>
              <span>{tenant?.id || tenantId}</span>
              <button
                className="link"
                onClick={() => handleCopy(tenant?.id || tenantId!, "Tenant ID")}
              >
                Copiar
              </button>
            </div>
            {renderEditableRow(
              "Nombre",
              "name",
              tenant?.name || "",
              "Nombre del cliente",
            )}
            <div className="mini-row">
              <span>Estado</span>
              <span className={`status ${tenant?.status || "active"}`}>
                {tenant?.status || "active"}
              </span>
            </div>
            <div className="mini-row">
              <span>Kill switch</span>
              <span>{tenant?.killSwitch ? "ON" : "OFF"}</span>
            </div>
            {renderEditableRow(
              "Email facturación",
              "billingEmail",
              tenant?.billingEmail || "No definido",
              "billing@cliente.com",
              "email",
            )}
            {renderEditableRow(
              "Empresa",
              "companyName",
              tenant?.companyName || "",
              "Razón social",
            )}
            {renderEditableRow(
              "Responsable",
              "contactName",
              tenant?.contactName || "",
              "Nombre del responsable",
            )}
            {renderEditableRow(
              "Teléfono",
              "phone",
              tenant?.phone || "",
              "+34 600 000 000",
              "tel",
            )}
            {renderEditableRow(
              "Web",
              "website",
              tenant?.website || "",
              "https://cliente.com",
            )}
            {renderEditableRow(
              "CIF/NIF",
              "taxId",
              tenant?.taxId || "",
              "B12345678",
            )}
            {renderEditableRow(
              "Dirección",
              "addressLine1",
              tenant?.addressLine1 || "",
              "Calle, número",
            )}
            {renderEditableRow(
              "Dirección (2)",
              "addressLine2",
              tenant?.addressLine2 || "",
              "Piso, puerta",
            )}
            {renderEditableRow("Ciudad", "city", tenant?.city || "", "Madrid")}
            {renderEditableRow(
              "Código postal",
              "postalCode",
              tenant?.postalCode || "",
              "28001",
            )}
            {renderEditableRow(
              "País",
              "country",
              tenant?.country || "",
              "España",
            )}
            {renderEditableRow(
              "Dirección facturación",
              "billingAddressLine1",
              tenant?.billingAddressLine1 || "",
              "Calle, número",
            )}
            {renderEditableRow(
              "Dirección facturación (2)",
              "billingAddressLine2",
              tenant?.billingAddressLine2 || "",
              "Piso, puerta",
            )}
            {renderEditableRow(
              "Ciudad facturación",
              "billingCity",
              tenant?.billingCity || "",
              "Madrid",
            )}
            {renderEditableRow(
              "CP facturación",
              "billingPostalCode",
              tenant?.billingPostalCode || "",
              "28001",
            )}
            {renderEditableRow(
              "País facturación",
              "billingCountry",
              tenant?.billingCountry || "",
              "España",
            )}
          </div>
        </div>

        <div className="card" id="providers">
          <h2>Providers</h2>
          <p className="muted">Proveedores registrados para este tenant.</p>
          <div className="mini-list">
            {providers.map((provider) => (
              <div className="mini-row" key={provider.id}>
                <span>{provider.displayName}</span>
                <span>{provider.type}</span>
                <button
                  className="link"
                  onClick={() => handleCopy(provider.id, "Provider ID")}
                >
                  Copiar ID
                </button>
                <span
                  className={`status ${provider.enabled ? "active" : "disabled"}`}
                >
                  {provider.enabled ? "active" : "disabled"}
                </span>
              </div>
            ))}
          </div>
          {providers.length === 0 && (
            <div className="muted">Sin providers.</div>
          )}
        </div>

        <div className="card" id="policies">
          <h2>Política</h2>
          <p className="muted">Límites configurados para este tenant.</p>
          {policy ? (
            <div className="mini-list">
              <div className="mini-row">
                <span>Req/min</span>
                <span>{policy.maxRequestsPerMinute}</span>
              </div>
              <div className="mini-row">
                <span>Tokens/día</span>
                <span>{policy.maxTokensPerDay}</span>
              </div>
              <div className="mini-row">
                <span>Coste diario (USD/EUR)</span>
                <span>{formatUsdWithEur(policy.maxCostPerDayUsd)}</span>
              </div>
              <div className="mini-row">
                <span>Redacción</span>
                <span>{policy.redactionEnabled ? "ON" : "OFF"}</span>
              </div>
            </div>
          ) : (
            <div className="muted">No hay política configurada.</div>
          )}
        </div>

        <div className="card">
          <h2>Servicios habilitados</h2>
          <p className="muted">Servicios incluidos en la suscripción actual.</p>
          <div className="chart-block">
            <Chart option={serviceOption} height={200} />
          </div>
          {!subscription && (
            <div className="muted">
              No hay suscripción activa. Crea una suscripción para habilitar
              servicios.
            </div>
          )}
          {subscription && (
            <div className="mini-list">
              {visibleServices.map((service) => {
                const serviceEntry = subscriptionServiceMap.get(service.code);
                const status = serviceEntry?.status || "disabled";
                const activateAt = serviceEntry?.activateAt
                  ? new Date(serviceEntry.activateAt).toLocaleDateString()
                  : null;
                const deactivateAt = serviceEntry?.deactivateAt
                  ? new Date(serviceEntry.deactivateAt).toLocaleDateString()
                  : null;
                const rawPrice =
                  subscription.period === "annual"
                    ? service.priceAnnualEur
                    : service.priceMonthlyEur;
                const price = Number(rawPrice || 0);
                return (
                  <div className="mini-row" key={service.code}>
                    <span>{service.name}</span>
                    <span>{formatEur(price)}</span>
                    <span
                      className={`status ${
                        status === "pending" || status === "pending_removal"
                          ? "warning"
                          : status
                      }`}
                    >
                      {status === "pending"
                        ? `pendiente${activateAt ? ` · ${activateAt}` : ""}`
                        : status === "pending_removal"
                          ? `baja pendiente${deactivateAt ? ` · ${deactivateAt}` : ""}`
                          : status}
                    </span>
                    <button
                      className="link"
                      type="button"
                      onClick={() =>
                        setServiceDoc({
                          title: service.name,
                          content: service.description,
                        })
                      }
                    >
                      Ver documentación
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2>Suscripción</h2>
              <p className="muted">
                Gestión de tarifa base y servicios incluidos.
              </p>
            </div>
            {subscription && (
              <span
                className={`status ${subscription.status === "cancelled" ? "critical" : "active"}`}
              >
                {subscription.status}
              </span>
            )}
          </div>
          {!subscription && (
            <div className="muted">
              Este cliente aún no tiene suscripción. Puedes crearla desde aquí.
            </div>
          )}
          {subscription && (
            <div className="mini-list">
              <div className="mini-row">
                <span>Periodo</span>
                <span>{subscription.period}</span>
              </div>
              <div className="mini-row">
                <span>Inicio</span>
                <span>
                  {new Date(
                    subscription.currentPeriodStart,
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="mini-row">
                <span>Renovación</span>
                <span>
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              </div>
              <div className="mini-row">
                <span>Base</span>
                <span>{formatEur(Number(subscription.basePriceEur || 0))}</span>
              </div>
              {subscriptionSummary?.totals && (
                <div className="mini-row">
                  <span>Total actual</span>
                  <span>{formatEur(subscriptionSummary.totals.totalEur)}</span>
                </div>
              )}
              {selectedServices.map((service) => (
                <div className="mini-row" key={service.code}>
                  <span>{service.name}</span>
                  <span>
                    {formatEur(
                      subscriptionForm.period === "annual"
                        ? service.priceAnnualEur
                        : service.priceMonthlyEur,
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {canManageSubscription && (
            <div className="form-grid">
              {!tenant?.billingEmail && (
                <div className="info-banner full-row">
                  Debes definir un email de facturación en el tenant para poder
                  activar la suscripción.
                </div>
              )}
              <label>
                Periodo
                <select
                  value={subscriptionForm.period}
                  onChange={(event) =>
                    setSubscriptionForm((prev) => ({
                      ...prev,
                      period: event.target.value as "monthly" | "annual",
                    }))
                  }
                >
                  <option value="monthly">monthly</option>
                  <option value="annual">annual</option>
                </select>
              </label>
              <label>
                Base € (mensual o anual según periodo)
                <input
                  type="number"
                  value={subscriptionForm.basePriceEur}
                  onChange={(event) =>
                    setSubscriptionForm((prev) => ({
                      ...prev,
                      basePriceEur: Number(event.target.value),
                    }))
                  }
                  placeholder="49"
                />
              </label>
              <label>
                Cancelar al final del periodo
                <input
                  type="checkbox"
                  checked={subscriptionForm.cancelAtPeriodEnd}
                  onChange={(event) =>
                    setSubscriptionForm((prev) => ({
                      ...prev,
                      cancelAtPeriodEnd: event.target.checked,
                    }))
                  }
                />
              </label>
              <div className="form-grid full-row">
                <div className="muted">
                  Selecciona los servicios. Si la suscripción está activa, los
                  nuevos servicios se activarán en la próxima renovación.
                </div>
                <div className="form-grid form-grid-compact">
                  {visibleServices.map((service) => (
                    <label className="checkbox" key={service.code}>
                      <input
                        type="checkbox"
                        checked={subscriptionForm.serviceCodes.includes(
                          service.code,
                        )}
                        onChange={(event) => {
                          void handleServiceToggle(service, event.target.checked);
                        }}
                      />
                      {service.name} ·{" "}
                      {formatEur(
                        subscriptionForm.period === "annual"
                          ? service.priceAnnualEur
                          : service.priceMonthlyEur,
                      )}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-actions">
                <button
                  className="btn primary"
                  onClick={() =>
                    subscription
                      ? handleSaveSubscription()
                      : setSubscriptionReviewOpen(true)
                  }
                  disabled={
                    subscription ? subscriptionBusy : !canReviewSubscription
                  }
                >
                  {subscription ? "Guardar suscripción" : "Revisar y confirmar"}
                </button>
                {subscription && (
                  <>
                    <button
                      className="btn"
                      onClick={() => handleCancelSubscription("period")}
                      disabled={
                        subscriptionBusy || subscription.cancelAtPeriodEnd
                      }
                    >
                      Cancelar al final
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => handleCancelSubscription("now")}
                      disabled={subscriptionBusy}
                    >
                      Dar de baja
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="card" id="pricing">
          <h2>Pricing asociado</h2>
          {!(isTenant && pricingSelection.length === 0) && (
            <p className="muted">
              Selecciona los modelos que aplican a este cliente.
            </p>
          )}
          {isTenant && pricingSelection.length === 0 ? (
            <div className="muted">No hay pricing asociado.</div>
          ) : (
            <div className="form-grid">
              <div className="multiselect-wrapper">
                <Multiselect
                  data={pricingOptions}
                  multiple
                  includeSelectAllOption
                  enableFiltering
                  enableCaseInsensitiveFiltering
                  maxHeight={260}
                  buttonWidth="100%"
                  disabled={!canManagePricing}
                  nonSelectedText="Selecciona pricing"
                  allSelectedText="Todos"
                  nSelectedText="seleccionados"
                  onChange={handlePricingChange}
                  onSelectAll={() =>
                    setPricingSelection(pricing.map((entry) => entry.id))
                  }
                  onDeselectAll={() => setPricingSelection([])}
                  buttonText={(options: any) => {
                    const count = options?.length || 0;
                    if (count === 0) {
                      return "Selecciona pricing";
                    }
                    if (count === pricingOptions.length) {
                      return `Todos (${count})`;
                    }
                    return `${count} seleccionados`;
                  }}
                />
              </div>
              {canManagePricing && (
                <div className="form-actions">
                  <button
                    className="btn primary"
                    onClick={handleSavePricing}
                    disabled={saving}
                  >
                    Guardar pricing
                  </button>
                </div>
              )}
            </div>
          )}
          {pricing.length === 0 && !isTenant && (
            <div className="muted">Sin pricing.</div>
          )}
        </div>

        {!(isTenant && pricingSelection.length === 0) && (
          <div className="card">
            <h2>API Keys</h2>
            <p className="muted">Keys asociadas a este tenant.</p>
            <div className="mini-list">
              {apiKeys.map((key) => (
                <div className="mini-row" key={key.id}>
                  <span>{key.name}</span>
                  <span className={`status ${key.status}`}>{key.status}</span>
                  {canManageApiKeys && (
                    <button
                      className="link"
                      onClick={() => handleRotateKey(key.id)}
                    >
                      Regenerar y copiar
                    </button>
                  )}
                </div>
              ))}
            </div>
            {apiKeys.length === 0 && <div className="muted">Sin API keys.</div>}
          </div>
        )}

        <div className="card">
          <h2>Tendencia de uso</h2>
          <p className="muted">Tokens y coste por día (últimos 7 días).</p>
          <Chart option={usageTrendOption} height={220} />
          <div className="chart-row">
            <div className="chart-metric">
              <span className="muted">Tokens 7d</span>
              <div className="metric">
                {dailyUsage.tokens
                  .reduce((acc, value) => acc + value, 0)
                  .toLocaleString()}
              </div>
              <Sparkline
                data={dailyUsage.labels.map((label, index) => ({
                  label,
                  value: dailyUsage.tokens[index] || 0,
                }))}
              />
            </div>
            <div className="chart-metric">
              <span className="muted">Coste 7d (USD/EUR)</span>
              <div className="metric">
                {formatUsdWithEur(
                  dailyUsage.cost.reduce((acc, value) => acc + value, 0),
                )}
              </div>
              <Sparkline
                data={dailyUsage.labels.map((label, index) => ({
                  label,
                  value: Number(dailyUsage.cost[index] || 0),
                }))}
                color="#d8512a"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Uso (hoy)</h2>
          <p className="muted">Resumen de consumo diario.</p>
          {usageSummary ? (
            <div className="mini-list">
              <div className="mini-row">
                <span>Tokens</span>
                <span>{usageSummary.tokens}</span>
              </div>
              <div className="mini-row">
                <span>Coste USD</span>
                <span>{formatUsdWithEur(usageSummary.costUsd)}</span>
              </div>
            </div>
          ) : (
            <div className="muted">Sin datos de uso.</div>
          )}
        </div>

        <div className="card">
          <h2>Logs de uso</h2>
          <p className="muted">Últimos eventos de consumo.</p>
          <div className="mini-list">
            {usageEvents.map((event) => (
              <div className="mini-row" key={event.id}>
                <span>{event.model}</span>
                <span>{event.tokensIn + event.tokensOut} tokens</span>
                <span>{formatUsdWithEur(event.costUsd)}</span>
                <span>{new Date(event.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
          {usageEvents.length === 0 && (
            <div className="muted">Sin eventos de uso.</div>
          )}
        </div>

        <div className="card">
          <h2>Auditoría</h2>
          <p className="muted">Eventos de auditoría más recientes.</p>
          <div className="audit-list">
            {auditEvents.map((event) => (
              <div className="audit-item" key={event.id}>
                <div>
                  <div className="audit-action">{event.action}</div>
                  <div className="muted">
                    {new Date(event.createdAt).toLocaleString()}
                  </div>
                </div>
                <span className={`status ${event.status}`}>{event.status}</span>
              </div>
            ))}
          </div>
          {auditEvents.length === 0 && (
            <div className="muted">Sin auditoría.</div>
          )}
        </div>
      </section>

        <div className="card full-width">
          <div className="card-header">
            <div>
              <h2>Usuarios de chat</h2>
              <p className="muted">
                Gestiona los usuarios finales que chatean con el cliente.
              </p>
            </div>
          {canManageChatUsers && (
            <button className="btn primary" onClick={openCreateChatUser}>
              Crear
            </button>
          )}
        </div>
        <DataTable
          columns={chatUserColumns}
          data={chatUsers}
          getRowId={(user) => user.id}
          pageSize={6}
          filterKeys={["name", "email", "status"]}
        />
        {chatUsers.length === 0 && (
          <div className="muted">Sin usuarios creados.</div>
        )}
      </div>

      <div className="card full-width">
        <div className="card-header">
          <div>
            <h2>Conversaciones de chat</h2>
            <p className="muted">
              Histórico de conversaciones guardadas por este cliente.
            </p>
          </div>
        </div>
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
                    onClick={() => handleSelectConversation(conversation.id)}
                    disabled={chatBusy}
                  >
                    Ver mensajes
                  </button>
                  {canManageConversations && (
                    <button
                      className="link danger"
                      onClick={() => handleDeleteConversation(conversation.id)}
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
              <div className="muted">Sin mensajes en esta conversación.</div>
            )}
          </div>
        )}
      </div>

      {canManageChatUsers && chatUserModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setChatUserModalOpen(false)}
        >
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  {chatUserMode === "create"
                    ? "Nuevo usuario"
                    : "Editar usuario"}
                </div>
                <h3>
                  {chatUserMode === "create"
                    ? "Crear usuario de chat"
                    : "Editar usuario"}
                </h3>
              </div>
              <button
                className="btn"
                onClick={() => setChatUserModalOpen(false)}
              >
                Cerrar
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  Nombre
                  <input
                    value={newChatUser.name}
                    onChange={(event) =>
                      setNewChatUser((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="María López"
                  />
                </label>
                <label>
                  Email
                  <input
                    value={newChatUser.email}
                    onChange={(event) =>
                      setNewChatUser((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    placeholder="usuario@cliente.com"
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={newChatUser.password}
                    onChange={(event) =>
                      setNewChatUser((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                    placeholder={
                      chatUserMode === "create"
                        ? "mínimo 6 caracteres"
                        : "dejar vacío para no cambiar"
                    }
                  />
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn primary"
                onClick={handleSaveChatUser}
                disabled={
                  chatBusy ||
                  !newChatUser.email.trim() ||
                  (chatUserMode === "create" && !newChatUser.password.trim())
                }
              >
                {chatUserMode === "create"
                  ? "Crear usuario"
                  : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {serviceDoc && (
        <div className="modal-backdrop" onClick={() => setServiceDoc(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="eyebrow">Documentación</div>
                <h3>{serviceDoc.title}</h3>
              </div>
              <button className="btn" onClick={() => setServiceDoc(null)}>
                Cerrar
              </button>
            </div>
            <div className="modal-body">
              <p className="muted">{serviceDoc.content}</p>
            </div>
          </div>
        </div>
      )}

      {subscriptionReviewOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setSubscriptionReviewOpen(false)}
        >
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="eyebrow">Revisión de suscripción</div>
                <h3>Confirmar alta</h3>
              </div>
              <button
                className="btn"
                onClick={() => setSubscriptionReviewOpen(false)}
              >
                Cerrar
              </button>
            </div>
            <div className="modal-body">
              <div className="mini-list">
                <div className="mini-row">
                  <span>Cliente</span>
                  <span>{tenant?.name || tenantId}</span>
                </div>
                <div className="mini-row">
                  <span>Email facturación</span>
                  <span>{tenant?.billingEmail || "No definido"}</span>
                </div>
                <div className="mini-row">
                  <span>Periodo</span>
                  <span>{subscriptionForm.period}</span>
                </div>
                <div className="mini-row">
                  <span>Base</span>
                  <span>
                    {formatEur(Number(subscriptionForm.basePriceEur || 0))}
                  </span>
                </div>
                {selectedServices.map((service) => (
                  <div className="mini-row" key={service.code}>
                    <span>{service.name}</span>
                    <span>
                      {formatEur(
                        subscriptionForm.period === "annual"
                          ? service.priceAnnualEur
                          : service.priceMonthlyEur,
                      )}
                    </span>
                  </div>
                ))}
                <div className="mini-row">
                  <span>Total</span>
                  <span>{formatEur(subscriptionTotalEur)}</span>
                </div>
              </div>
              <div className="muted" style={{ marginTop: 12 }}>
                Al confirmar, se enviará un email con el enlace de pago al
                titular.
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn primary"
                onClick={async () => {
                  await handleSaveSubscription();
                  setSubscriptionReviewOpen(false);
                }}
                disabled={!canReviewSubscription}
              >
                Confirmar y enviar email
              </button>
              <button
                className="btn"
                onClick={() => setSubscriptionReviewOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWithDocs>
  );
}
