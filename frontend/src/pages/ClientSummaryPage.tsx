import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { Chart, Sparkline } from "../components/charts/Charts";
import { DataTable, type DataTableColumn } from "../components/DataTable";
import { PageWithDocs } from "../components/PageWithDocs";
import { LoaderComponent } from "../components/LoaderComponent";
import { StatusBadgeIcon } from "../components/StatusBadgeIcon";
import { InfoTooltip } from "../components/InfoTooltip";
import { useAuth } from "../auth";
import { useDashboard } from "../dashboard";
import { emitToast } from "../toast";
import Swal from "sweetalert2";
import { MultiSelectDropdown } from "../components/MultiSelectDropdown";
import { jsPDF } from "jspdf";
import type {
  ApiKeySummary,
  AuditEvent,
  ChatUserSummary,
  Policy,
  Provider,
  PricingEntry,
  ServiceCatalogItem,
  SubscriptionSummary,
  Tenant,
  TenantServiceEndpoint,
  TenantServiceOverview,
  TenantServiceUser,
  TenantInvoiceEntry,
  UsageEvent,
  UsageSummary,
} from "../types";
import { buildDailyUsage } from "../utils/chartData";
import { formatEur, formatUsdWithEur } from "../utils/currency";
import { copyToClipboard } from "../utils/clipboard";
import { getTenantApiKey, storeTenantApiKey } from "../utils/apiKeyStorage";
import { Z2_EMPHASIS_LIFT } from "echarts/types/src/util/states.js";
import { useI18n } from "../i18n/I18nProvider";

export function ClientSummaryPage() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const {
    role,
    tenantId: authTenantId,
    loading: authLoading,
    isAuthenticated,
  } = useAuth();
  const isTenant = role === "tenant";
  const canEditTenant = role === "admin" || role === "tenant";
  const canManageChatUsers = role === "admin" || role === "tenant";
  const canManageServices = role === "admin" || role === "tenant";
  const canManageSubscription = role === "admin";
  const canCancelSubscription = role === "admin" || role === "tenant";
  const canDeleteSubscription = role === "admin";
  const canDeleteServiceAssignment = role === "admin";
  const canManagePricing = role === "admin";
  const canManageApiKeys = role === "admin";
  const canManageProviders = role === "admin";
  const canManagePolicies = role === "admin";
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
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [providerBusy, setProviderBusy] = useState(false);
  const [providerForm, setProviderForm] = useState({
    type: "openai",
    displayName: "",
    apiKey: "",
    baseUrl: "https://api.openai.com",
    endpoint: "",
    deployment: "",
    apiVersion: "2024-02-15-preview",
    accessKeyId: "",
    secretAccessKey: "",
    sessionToken: "",
    region: "us-east-1",
    modelId: "",
    projectId: "",
    location: "us-central1",
    gcpModel: "",
    serviceAccount: "",
    config: "{}",
    enabled: true,
  });
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [policyCatalog, setPolicyCatalog] = useState<Policy[]>([]);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyBusy, setPolicyBusy] = useState(false);
  const [policyForm, setPolicyForm] = useState({
    maxRequestsPerMinute: 60,
    maxTokensPerDay: 200000,
    maxCostPerDayUsd: 0,
    redactionEnabled: true,
    metadata: "{}",
  });
  const [pricing, setPricing] = useState<PricingEntry[]>([]);
  const [pricingSelection, setPricingSelection] = useState<string[]>([]);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [pricingBusy, setPricingBusy] = useState(false);
  const [pricingForm, setPricingForm] = useState({
    providerType: "openai",
    model: "",
    inputCostPer1k: "",
    outputCostPer1k: "",
    enabled: true,
  });
  const [apiKeys, setApiKeys] = useState<ApiKeySummary[]>([]);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [assignServicesModalOpen, setAssignServicesModalOpen] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [apiKeyBusy, setApiKeyBusy] = useState(false);
  const hasTenantApiKey = apiKeys.some((key) => key.status === "active");
  const activeApiKey = apiKeys.find((key) => key.status === "active") || null;
  const [serviceRuntimeForm, setServiceRuntimeForm] = useState({
    providerId: "",
    model: "",
    payload: '{"messages":[{"role":"user","content":"Hola"}]}',
  });
  const [serviceRuntimeResult, setServiceRuntimeResult] = useState<any>(null);
  const [serviceRuntimeError, setServiceRuntimeError] = useState<string | null>(
    null,
  );
  const [serviceRuntimeBusy, setServiceRuntimeBusy] = useState(false);
  const canCreateApiKey =
    providers.length > 0 && Boolean(policy) && pricingSelection.length > 0;
  const [chatUsers, setChatUsers] = useState<ChatUserSummary[]>([]);
  const [storedApiKey, setStoredApiKey] = useState<string | null>(null);
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
  const [activeAccordion, setActiveAccordion] = useState("tenant-acc-1");
  const [serviceCatalog, setServiceCatalog] = useState<ServiceCatalogItem[]>(
    [],
  );
  const [tenantServices, setTenantServices] = useState<TenantServiceOverview[]>(
    [],
  );
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [activeService, setActiveService] =
    useState<TenantServiceOverview | null>(null);
  const [serviceConfigDraft, setServiceConfigDraft] = useState({
    status: "active" as "active" | "suspended",
    systemPrompt: "",
    providerId: "",
    pricingId: "",
    policyId: "",
  });
  const [serviceEndpoints, setServiceEndpoints] = useState<
    TenantServiceEndpoint[]
  >([]);
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
  const [serviceUsers, setServiceUsers] = useState<TenantServiceUser[]>([]);
  const [serviceAssignUserId, setServiceAssignUserId] = useState("");
  const [serviceBusy, setServiceBusy] = useState(false);
  const [subscriptionSummary, setSubscriptionSummary] =
    useState<SubscriptionSummary | null>(null);
  const [tenantInvoices, setTenantInvoices] = useState<TenantInvoiceEntry[]>(
    [],
  );
  const [subscriptionForm, setSubscriptionForm] = useState({
    period: "monthly" as "monthly" | "annual",
    basePriceEur: 49,
    serviceCodes: [] as string[],
    cancelAtPeriodEnd: false,
  });
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [subscriptionCreating, setSubscriptionCreating] = useState(false);
  const [subscriptionReviewOpen, setSubscriptionReviewOpen] = useState(false);
  const [addonServiceCode, setAddonServiceCode] = useState("");
  const [addonBusy, setAddonBusy] = useState(false);
  const [addonError, setAddonError] = useState<string | null>(null);
  const [addonEndpoints, setAddonEndpoints] = useState<TenantServiceEndpoint[]>(
    [],
  );
  const [addonEndpointsExpanded, setAddonEndpointsExpanded] = useState(false);
  const addonEndpointsExample =
    '{"label":"Chat principal","method":"POST","path":"/v1/chat"}\n{"label":"Salud","method":"GET","path":"/health"}';
  const [addonEndpointsInput, setAddonEndpointsInput] = useState(
    addonEndpointsExample,
  );
  const [addonEndpointsError, setAddonEndpointsError] = useState<string | null>(
    null,
  );
  const [addonEndpointsBusy, setAddonEndpointsBusy] = useState(false);
  const [serviceRemoveBusy, setServiceRemoveBusy] = useState(false);
  const [serviceDoc, setServiceDoc] = useState<{
    title: string;
    content: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!tenantId) {
      setStoredApiKey(null);
      return;
    }
    setStoredApiKey(getTenantApiKey(tenantId));
  }, [tenantId, createdApiKey, apiKeys]);

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
  const serviceOverviewMap = useMemo(
    () =>
      new Map(tenantServices.map((service) => [service.serviceCode, service])),
    [tenantServices],
  );
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
  const canReactivateSubscription = useMemo(() => {
    if (!subscription || !subscription.cancelAtPeriodEnd) {
      return false;
    }
    if (subscription.status !== "active") {
      return false;
    }
    if (!subscription.currentPeriodEnd) {
      return false;
    }
    return new Date(subscription.currentPeriodEnd).getTime() > Date.now();
  }, [subscription]);

  const canReviewSubscription =
    canManageSubscription &&
    Boolean(tenant?.billingEmail) &&
    hasTenantApiKey &&
    Number(subscriptionForm.basePriceEur || 0) > 0 &&
    !subscriptionBusy;
  const canEditSubscription = canManageSubscription && hasTenantApiKey;
  const contractedServices = useMemo(
    () =>
      tenantServices.filter(
        (service) => service.subscriptionStatus !== "disabled",
      ),
    [tenantServices],
  );
  const availableAddonServices = useMemo(
    () =>
      tenantServices.filter(
        (service) =>
          service.subscriptionStatus === "disabled" ||
          service.subscriptionStatus === "pending_removal",
      ),
    [tenantServices],
  );
  const addonService = useMemo(
    () =>
      tenantServices.find(
        (service) => service.serviceCode === addonServiceCode,
      ) || null,
    [tenantServices, addonServiceCode],
  );
  const addonAlreadyAdded = useMemo(
    () =>
      subscriptionServices.some(
        (item) =>
          item.serviceCode === addonServiceCode &&
          item.status !== "pending_removal",
      ),
    [subscriptionServices, addonServiceCode],
  );
  const addonSelectOptions = useMemo(() => {
    if (!addonService) {
      return availableAddonServices;
    }
    const exists = availableAddonServices.some(
      (service) => service.serviceCode === addonService.serviceCode,
    );
    return exists
      ? availableAddonServices
      : [addonService, ...availableAddonServices];
  }, [availableAddonServices, addonService]);
  const backendBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const addonProviderId = useMemo(() => {
    if (addonService?.providerId) {
      return addonService.providerId;
    }
    return providers.find((item) => item.enabled)?.id || providers[0]?.id || "";
  }, [addonService, providers]);
  const addonModel = useMemo(() => {
    const pricingId = addonService?.pricingId || pricingSelection[0];
    if (!pricingId) {
      return "";
    }
    return pricing.find((item) => item.id === pricingId)?.model || "";
  }, [addonService, pricingSelection, pricing]);
  const addonEnvValues = useMemo(() => {
    if (!tenantId || !addonService) {
      return null;
    }
    return {
      apiBaseUrl: backendBaseUrl,
      apiKey: createdApiKey ?? "",
      providerId: addonProviderId,
      model: addonModel,
      tenantId,
      serviceId: addonService?.tenantServiceId || "",
      chatEndpoint: "persisted",
    };
  }, [
    tenantId,
    addonService,
    createdApiKey,
    addonProviderId,
    addonModel,
    backendBaseUrl,
  ]);

  const serviceOption = useMemo(() => {
    const seriesData =
      contractedServices.length > 0
        ? contractedServices.map((service) => ({
            name: service.name,
            value: 1,
          }))
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
  }, [contractedServices]);

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

  const selectedPricingEntries = useMemo(
    () =>
      pricingSelection
        .map((id) => pricing.find((entry) => entry.id === id))
        .filter(Boolean) as PricingEntry[],
    [pricing, pricingSelection],
  );

  const handlePricingSelectionChange = (next: string[]) => {
    if (!canManagePricing) {
      return;
    }
    setPricingSelection(next);
  };

  useEffect(() => {
    if (!tenantId || authLoading || !isAuthenticated) {
      return;
    }
    const load = async () => {
      try {
        const tenantList = await api.getTenants();
        setTenant(
          tenantList.find((item: Tenant) => item.id === tenantId) || null,
        );

        const results = await Promise.allSettled([
          api.getProviders(tenantId),
          api.getPolicy(tenantId),
          api.getPricing(),
          api.listApiKeys(),
          api.getUsageSummary(tenantId),
          api.getUsageEvents(tenantId, 25),
          api.getAudit(25, tenantId),
          api.listServiceCatalog(),
          api.getTenantSubscription(tenantId),
          api.getTenantInvoices(tenantId),
          api.getTenantServices(tenantId),
          api.getTenantPricing(tenantId),
          api.listChatUsers(tenantId),
          canManagePolicies ? api.listPolicies() : Promise.resolve(null),
        ]);

        const [
          providerList,
          policyData,
          pricingList,
          apiKeyList,
          summary,
          events,
          audit,
          catalogList,
          subscriptionData,
          invoiceList,
          tenantServicesList,
          pricingAssignment,
          chatUsersList,
          policyCatalogList,
        ] = results.map((result) =>
          result.status === "fulfilled" ? result.value : null,
        );

        if (providerList) setProviders(providerList);
        if (policyData) setPolicy(policyData || null);
        if (pricingList) setPricing(pricingList);
        if (pricingAssignment)
          setPricingSelection(pricingAssignment?.pricingIds || []);
        if (apiKeyList) {
          setApiKeys(
            (apiKeyList as ApiKeySummary[]).filter(
              (item) => item.tenantId === tenantId,
            ),
          );
        }
        if (chatUsersList) setChatUsers(chatUsersList as ChatUserSummary[]);
        if (policyCatalogList) {
          const list = (policyCatalogList as Policy[]).filter(
            (item) => item.tenantId === tenantId,
          );
          setPolicyCatalog(list);
        } else if (policy) {
          setPolicyCatalog([policy]);
        }
        if (summary) setUsageSummary(summary);
        if (events) setUsageEvents(events);
        if (audit) setAuditEvents(audit);
        if (catalogList) setServiceCatalog(catalogList as ServiceCatalogItem[]);
        if (tenantServicesList)
          setTenantServices(tenantServicesList as TenantServiceOverview[]);
        if (subscriptionData) {
          setSubscriptionSummary(subscriptionData as SubscriptionSummary);
          if ((subscriptionData as any)?.subscription) {
            setSubscriptionForm({
              period: (subscriptionData as any).subscription.period,
              basePriceEur: Number(
                (subscriptionData as any).subscription.basePriceEur || 0,
              ),
              serviceCodes: ((subscriptionData as any).services || [])
                .filter((item: any) => item.status !== "pending_removal")
                .map((item: any) => item.serviceCode),
              cancelAtPeriodEnd: Boolean(
                (subscriptionData as any).subscription.cancelAtPeriodEnd,
              ),
            });
          } else {
            setSubscriptionForm((prev) => ({ ...prev, serviceCodes: [] }));
          }
        }
        if (invoiceList) setTenantInvoices(invoiceList as TenantInvoiceEntry[]);
        setError(null);
      } catch (err: any) {
        setError(err.message || t("Error cargando resumen de cliente"));
      }
    };
    load();
  }, [tenantId, authLoading, isAuthenticated]);

  const refreshTenantServices = async (serviceCode?: string) => {
    if (!tenantId) {
      return;
    }
    const list = (await api.getTenantServices(
      tenantId,
    )) as TenantServiceOverview[];
    setTenantServices(list);
    if (serviceCode) {
      setActiveService(
        list.find((item) => item.serviceCode === serviceCode) || null,
      );
    }
  };

  useEffect(() => {
    if (!tenantId || !addonServiceCode || !addonService) {
      setAddonEndpoints([]);
      return;
    }
    if (addonService.endpointsEnabled === false) {
      setAddonEndpoints([]);
      return;
    }
    let active = true;
    api
      .listTenantServiceEndpoints(tenantId, addonServiceCode)
      .then((list) => {
        if (active) {
          setAddonEndpoints(list as TenantServiceEndpoint[]);
        }
      })
      .catch(() => {
        if (active) {
          setAddonEndpoints([]);
        }
      });
    return () => {
      active = false;
    };
  }, [tenantId, addonServiceCode, addonService]);

  useEffect(() => {
    setAddonEndpointsInput(addonEndpointsExample);
    setAddonEndpointsError(null);
    setAddonEndpointsExpanded(false);
  }, [addonServiceCode, addonEndpointsExample]);

  const openServiceModal = async (service: TenantServiceOverview) => {
    if (!tenantId) {
      return;
    }
    setActiveService(service);
    setServiceConfigDraft({
      status: service.configStatus || "active",
      systemPrompt: service.systemPrompt || "",
      providerId: service.providerId || "",
      pricingId: service.pricingId || "",
      policyId: service.policyId || "",
    });
    const fallbackProviderId =
      service.providerId ||
      providers.find((item) => item.enabled)?.id ||
      providers[0]?.id ||
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
    setServiceModalOpen(true);
    setServiceBusy(true);
    try {
      const [endpoints, users] = await Promise.all([
        service.endpointsEnabled !== false
          ? api.listTenantServiceEndpoints(tenantId, service.serviceCode)
          : Promise.resolve([]),
        api.listTenantServiceUsers(tenantId, service.serviceCode),
      ]);
      setServiceEndpoints(endpoints as TenantServiceEndpoint[]);
      setServiceUsers(users as TenantServiceUser[]);
    } catch (err: any) {
      emitToast(err.message || t("No se pudo cargar el servicio"), "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const closeServiceModal = () => {
    setServiceModalOpen(false);
    setActiveService(null);
    setServiceEndpoints([]);
    setServiceUsers([]);
  };

  const handleSaveServiceConfig = async () => {
    if (!tenantId || !activeService) {
      return;
    }
    setServiceBusy(true);
    try {
      await api.updateTenantServiceConfig(tenantId, activeService.serviceCode, {
        status: serviceConfigDraft.status,
        systemPrompt: serviceConfigDraft.systemPrompt,
        providerId: serviceConfigDraft.providerId,
        pricingId: serviceConfigDraft.pricingId,
        policyId: serviceConfigDraft.policyId,
      });
      await refreshTenantServices(activeService.serviceCode);
      emitToast(t("Configuración del servicio guardada."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo guardar el servicio"), "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const handleServiceRuntimeTest = async () => {
    if (!tenantId || !activeService) {
      return;
    }
    if (!hasTenantApiKey) {
      setServiceRuntimeError(
        t("Necesitas una API key activa para ejecutar runtime."),
      );
      return;
    }
    const providerId =
      serviceConfigDraft.providerId || serviceRuntimeForm.providerId;
    if (!providerId.trim()) {
      setServiceRuntimeError(t("Provider es obligatorio."));
      return;
    }
    if (!serviceRuntimeForm.model.trim()) {
      setServiceRuntimeError(t("Modelo es obligatorio."));
      return;
    }
    let payload: Record<string, any> = {};
    try {
      payload = serviceRuntimeForm.payload
        ? JSON.parse(serviceRuntimeForm.payload)
        : {};
    } catch {
      setServiceRuntimeError(t("Payload debe ser JSON válido."));
      return;
    }
    try {
      setServiceRuntimeBusy(true);
      setServiceRuntimeError(null);
      const result = await api.executeRuntime(tenantId, {
        providerId: providerId.trim(),
        model: serviceRuntimeForm.model.trim(),
        payload,
        serviceCode: activeService.serviceCode,
      });
      setServiceRuntimeResult(result);
      emitToast(t("Runtime ejecutado"));
    } catch (err: any) {
      setServiceRuntimeError(err.message || t("Error ejecutando runtime"));
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
      emitToast(t("Headers debe ser un JSON válido."), "error");
      return undefined;
    }
  };

  const handleSaveEndpoint = async () => {
    if (!tenantId || !activeService) {
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
          activeService.serviceCode,
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
        await api.createTenantServiceEndpoint(
          tenantId,
          activeService.serviceCode,
          {
            slug: serviceEndpointDraft.slug,
            method: serviceEndpointDraft.method,
            path: serviceEndpointDraft.path,
            baseUrl: serviceEndpointDraft.baseUrl || null,
            headers,
            enabled: serviceEndpointDraft.enabled,
          },
        );
      }
      const endpoints = await api.listTenantServiceEndpoints(
        tenantId,
        activeService.serviceCode,
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
      emitToast(t("Endpoint guardado."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo guardar el endpoint"), "error");
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
    if (!tenantId || !activeService) {
      return;
    }
    const result = await Swal.fire({
      title: t("¿Eliminar endpoint?"),
      text: endpoint.slug,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Eliminar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      return;
    }
    setServiceBusy(true);
    try {
      await api.deleteTenantServiceEndpoint(
        tenantId,
        activeService.serviceCode,
        endpoint.id,
      );
      setServiceEndpoints((prev) =>
        prev.filter((item) => item.id !== endpoint.id),
      );
      emitToast(t("Endpoint eliminado."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo eliminar el endpoint"), "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const handleAssignServiceUser = async () => {
    if (!tenantId || !activeService || !serviceAssignUserId) {
      return;
    }
    setServiceBusy(true);
    try {
      await api.assignTenantServiceUser(tenantId, activeService.serviceCode, {
        userId: serviceAssignUserId,
      });
      const users = await api.listTenantServiceUsers(
        tenantId,
        activeService.serviceCode,
      );
      setServiceUsers(users as TenantServiceUser[]);
      setServiceAssignUserId("");
      await refreshTenantServices(activeService.serviceCode);
      emitToast(t("Usuario asignado."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo asignar el usuario"), "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const handleUpdateServiceUserStatus = async (
    assignment: TenantServiceUser,
    status: "active" | "suspended",
  ) => {
    if (!tenantId || !activeService) {
      return;
    }
    setServiceBusy(true);
    try {
      await api.updateTenantServiceUser(
        tenantId,
        activeService.serviceCode,
        assignment.userId,
        { status },
      );
      const users = await api.listTenantServiceUsers(
        tenantId,
        activeService.serviceCode,
      );
      setServiceUsers(users as TenantServiceUser[]);
      emitToast(t("Usuario actualizado."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo actualizar el usuario"), "error");
    } finally {
      setServiceBusy(false);
    }
  };

  const handleRemoveServiceUser = async (assignment: TenantServiceUser) => {
    if (!tenantId || !activeService) {
      return;
    }
    const result = await Swal.fire({
      title: t("¿Quitar acceso al servicio?"),
      text: assignment.user.email,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Quitar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      return;
    }
    setServiceBusy(true);
    try {
      await api.removeTenantServiceUser(
        tenantId,
        activeService.serviceCode,
        assignment.userId,
      );
      const users = await api.listTenantServiceUsers(
        tenantId,
        activeService.serviceCode,
      );
      setServiceUsers(users as TenantServiceUser[]);
      await refreshTenantServices(activeService.serviceCode);
      emitToast(t("Usuario removido."));
    } catch (err: any) {
      emitToast(err.message || t("No se pudo quitar el usuario"), "error");
    } finally {
      setServiceBusy(false);
    }
  };

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
    if (!canManageSubscription) {
      return;
    }
    if (!hasTenantApiKey) {
      await Swal.fire({
        title: t("API key requerida"),
        text: t(
          "Necesitas una API key activa para crear o actualizar la suscripción.",
        ),
        icon: "info",
        confirmButtonText: t("Entendido"),
      });
      return;
    }
    if (subscription) {
      const result = await Swal.fire({
        title: t("Actualizar suscripción"),
        text: t("¿Guardar los cambios de la suscripción?"),
        icon: "question",
        showCancelButton: true,
        confirmButtonText: t("Guardar"),
        cancelButtonText: t("Cancelar"),
      });
      if (!result.isConfirmed) {
        return;
      }
    }
    const startedAt = Date.now();
    try {
      setSubscriptionCreating(true);
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
      const summary =
        updated && (updated as any).subscription
          ? updated
          : await api.getTenantSubscription(tenantId);
      setSubscriptionSummary(summary as SubscriptionSummary);
      if ((summary as any)?.subscription) {
        setSubscriptionForm({
          period: (summary as any).subscription.period,
          basePriceEur: Number((summary as any).subscription.basePriceEur || 0),
          serviceCodes: ((summary as any).services || [])
            .filter((item: any) => item.status !== "pending_removal")
            .map((item: any) => item.serviceCode),
          cancelAtPeriodEnd: Boolean(
            (summary as any).subscription.cancelAtPeriodEnd,
          ),
        });
      }
      try {
        const invoiceList = await api.getTenantInvoices(tenantId);
        setTenantInvoices(invoiceList as TenantInvoiceEntry[]);
      } catch {
        // ignore invoice refresh errors
      }
      emitToast(
        subscription ? t("Suscripción actualizada") : t("Suscripción creada"),
      );
    } catch (err: any) {
      try {
        const summary = await api.getTenantSubscription(tenantId);
        if ((summary as any)?.subscription) {
          setSubscriptionSummary(summary as SubscriptionSummary);
          setSubscriptionForm({
            period: (summary as any).subscription.period,
            basePriceEur: Number(
              (summary as any).subscription.basePriceEur || 0,
            ),
            serviceCodes: ((summary as any).services || [])
              .filter((item: any) => item.status !== "pending_removal")
              .map((item: any) => item.serviceCode),
            cancelAtPeriodEnd: Boolean(
              (summary as any).subscription.cancelAtPeriodEnd,
            ),
          });
          try {
            const invoiceList = await api.getTenantInvoices(tenantId);
            setTenantInvoices(invoiceList as TenantInvoiceEntry[]);
          } catch {
            // ignore invoice refresh errors
          }
          emitToast(
            t("Suscripción creada, pero hubo un error al confirmar el pago."),
            "error",
          );
          return;
        }
      } catch {
        // ignore refresh errors
      }
      setError(err.message || t("Error guardando suscripción"));
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = 3000 - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      setSubscriptionCreating(false);
      setSubscriptionBusy(false);
    }
  };

  const handleAddServiceAddon = async () => {
    if (!tenantId || !subscription) {
      return;
    }
    if (!canManageSubscription) {
      return;
    }
    if (!addonServiceCode) {
      setAddonError(t("Selecciona un servicio para añadir."));
      return;
    }
    if (!hasTenantApiKey) {
      await Swal.fire({
        title: t("API key requerida"),
        text: t("Necesitas una API key activa para añadir servicios."),
        icon: "info",
        confirmButtonText: t("Entendido"),
      });
      return;
    }
    setAddonBusy(true);
    setAddonError(null);
    try {
      const currentCodes = new Set(
        subscriptionServices
          .filter((item) => item.status !== "pending_removal")
          .map((item) => item.serviceCode),
      );
      currentCodes.add(addonServiceCode);
      const payload = {
        serviceCodes: Array.from(currentCodes),
      };
      const updated = await api.updateTenantSubscription(tenantId, payload);
      const summary =
        updated && (updated as any).subscription
          ? updated
          : await api.getTenantSubscription(tenantId);
      setSubscriptionSummary(summary as SubscriptionSummary);
      if ((summary as any)?.subscription) {
        setSubscriptionForm({
          period: (summary as any).subscription.period,
          basePriceEur: Number((summary as any).subscription.basePriceEur || 0),
          serviceCodes: ((summary as any).services || [])
            .filter((item: any) => item.status !== "pending_removal")
            .map((item: any) => item.serviceCode),
          cancelAtPeriodEnd: Boolean(
            (summary as any).subscription.cancelAtPeriodEnd,
          ),
        });
      }
      await refreshTenantServices(addonServiceCode);
      try {
        const invoiceList = await api.getTenantInvoices(tenantId);
        setTenantInvoices(invoiceList as TenantInvoiceEntry[]);
      } catch {
        // ignore invoice refresh errors
      }
      emitToast(t("Servicio añadido a la suscripción"));
    } catch (err: any) {
      setAddonError(err.message || t("Error añadiendo servicio"));
    } finally {
      setAddonBusy(false);
    }
  };

  const handleUnassignService = async (service: TenantServiceOverview) => {
    if (!tenantId || !subscription) {
      return;
    }
    const result = await Swal.fire({
      title: t("Desasignar servicio"),
      text: t("¿Desasignar {name}?", { name: service.name }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Desasignar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      setServiceRemoveBusy(true);
      const updated = await api.updateTenantSubscription(tenantId, {
        removeServiceCodes: [service.serviceCode],
      });
      const summary =
        updated && (updated as any).subscription
          ? updated
          : await api.getTenantSubscription(tenantId);
      setSubscriptionSummary(summary as SubscriptionSummary);
      if ((summary as any)?.subscription) {
        setSubscriptionForm({
          period: (summary as any).subscription.period,
          basePriceEur: Number((summary as any).subscription.basePriceEur || 0),
          serviceCodes: ((summary as any).services || [])
            .filter((item: any) => item.status !== "pending_removal")
            .map((item: any) => item.serviceCode),
          cancelAtPeriodEnd: Boolean(
            (summary as any).subscription.cancelAtPeriodEnd,
          ),
        });
      }
      await refreshTenantServices(service.serviceCode);
      try {
        const invoiceList = await api.getTenantInvoices(tenantId);
        setTenantInvoices(invoiceList as TenantInvoiceEntry[]);
      } catch {
        // ignore invoice refresh errors
      }
      emitToast(t("Servicio desasignado"));
    } catch (err: any) {
      emitToast(err.message || t("Error desasignando servicio"), "error");
    } finally {
      setServiceRemoveBusy(false);
    }
  };

  const handleDeleteServiceAssignment = async (
    service: TenantServiceOverview,
  ) => {
    if (!tenantId) {
      return;
    }
    if (!service.tenantServiceId) {
      emitToast(t("Service ID no disponible."), "error");
      return;
    }
    const result = await Swal.fire({
      title: t("Eliminar asignación"),
      text: t(
        "Se borrará la asignación y todos los datos asociados de {name}. Esta acción no se puede deshacer.",
        { name: service.name },
      ),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Eliminar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      setServiceRemoveBusy(true);
      const updated = await api.deleteTenantServiceAssignment(
        tenantId,
        service.tenantServiceId,
      );
      const summary =
        updated && (updated as any).subscription
          ? updated
          : await api.getTenantSubscription(tenantId);
      setSubscriptionSummary(summary as SubscriptionSummary);
      if ((summary as any)?.subscription) {
        setSubscriptionForm({
          period: (summary as any).subscription.period,
          basePriceEur: Number((summary as any).subscription.basePriceEur || 0),
          serviceCodes: ((summary as any).services || [])
            .filter((item: any) => item.status !== "pending_removal")
            .map((item: any) => item.serviceCode),
          cancelAtPeriodEnd: Boolean(
            (summary as any).subscription.cancelAtPeriodEnd,
          ),
        });
      }
      await refreshTenantServices(service.serviceCode);
      try {
        const invoiceList = await api.getTenantInvoices(tenantId);
        setTenantInvoices(invoiceList as TenantInvoiceEntry[]);
      } catch {
        // ignore invoice refresh errors
      }
      emitToast(t("Asignación eliminada"));
    } catch (err: any) {
      emitToast(err.message || t("Error eliminando asignación"), "error");
    } finally {
      setServiceRemoveBusy(false);
    }
  };

  const handleAddAddonEndpoints = async () => {
    if (!tenantId || !addonServiceCode || !addonService) {
      return;
    }
    if (addonService.endpointsEnabled === false) {
      setAddonEndpointsError(t("Este servicio no admite endpoints."));
      return;
    }
    if (!addonAlreadyAdded) {
      setAddonEndpointsError(
        t("Añade el servicio a la suscripción antes de informar endpoints."),
      );
      return;
    }
    const raw = addonEndpointsInput.trim();
    if (!raw) {
      setAddonEndpointsError(t("Introduce al menos un endpoint."));
      return;
    }
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      setAddonEndpointsError(t("Introduce endpoints válidos."));
      return;
    }
    const parsed: Array<{ label: string; method: string; path: string }> = [];
    const invalid: string[] = [];
    const allowedMethods = [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "HEAD",
      "OPTIONS",
    ];
    lines.forEach((line) => {
      try {
        const entry = JSON.parse(line);
        const label = String(entry?.label || "").trim();
        const method = String(entry?.method || "").toUpperCase();
        const path = String(entry?.path || "").trim();
        if (!label || !allowedMethods.includes(method) || !path) {
          invalid.push(line);
          return;
        }
        parsed.push({ label, method, path });
      } catch {
        invalid.push(line);
      }
    });
    if (invalid.length > 0) {
      setAddonEndpointsError(
        t(
          'Formato inválido. Usa JSON por línea con label. Ejemplo: {"label":"Chat","method":"POST","path":"/v1/chat"}',
        ),
      );
      return;
    }

    const slugify = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const usedSlugs = new Set(addonEndpoints.map((endpoint) => endpoint.slug));

    setAddonEndpointsBusy(true);
    setAddonEndpointsError(null);
    try {
      for (let index = 0; index < parsed.length; index += 1) {
        const { label, method, path } = parsed[index];
        const baseSlug =
          slugify(label).slice(0, 48) ||
          slugify(path).slice(0, 48) ||
          `endpoint-${index + 1}`;
        let slug = baseSlug;
        let counter = 1;
        while (usedSlugs.has(slug)) {
          slug = `${baseSlug}-${counter}`;
          counter += 1;
        }
        usedSlugs.add(slug);
        await api.createTenantServiceEndpoint(tenantId, addonServiceCode, {
          slug,
          method,
          path,
          baseUrl: null,
          headers: null,
          enabled: true,
        });
      }
      const list = await api.listTenantServiceEndpoints(
        tenantId,
        addonServiceCode,
      );
      setAddonEndpoints(list as TenantServiceEndpoint[]);
      await refreshTenantServices(addonServiceCode);
      setAddonEndpointsInput("");
      setAddonEndpointsExpanded(false);
      emitToast(t("Endpoints añadidos."));
    } catch (err: any) {
      setAddonEndpointsError(err.message || t("Error guardando endpoints."));
    } finally {
      setAddonEndpointsBusy(false);
    }
  };

  const handleServiceToggle = async (
    service: ServiceCatalogItem,
    checked: boolean,
  ) => {
    if (!canManageSubscription) {
      return;
    }
    if (!hasTenantApiKey) {
      await Swal.fire({
        title: t("API key requerida"),
        text: t("Necesitas una API key activa para asignar servicios."),
        icon: "info",
        confirmButtonText: t("Entendido"),
      });
      return;
    }
    const action = checked
      ? t("Activar servicio")
      : t("Desactivar servicio");
    const message = checked
      ? t(
          "Se añadirá el servicio y quedará pendiente hasta la próxima renovación.",
        )
      : t("Se dará de baja el servicio y no se cobrará en la próxima renovación.");
    const result = await Swal.fire({
      title: action,
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Confirmar"),
      cancelButtonText: t("Cancelar"),
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
    const resolvedName = nextForm.name.trim() || tenant?.name?.trim() || "";
    if (!tenantId) {
      setError(t("No se pudo identificar el tenant."));
      return;
    }
    try {
      setTenantSaving(true);
      const payload = buildTenantPayload({
        ...nextForm,
        name: resolvedName,
      });
      if (!resolvedName) {
        delete payload.name;
      }
      const updated =
        role === "tenant"
          ? await api.updateTenantSelf(payload)
          : await api.updateTenant(tenantId, payload);
      setTenant(updated as Tenant);
      setTenantForm((prev) => ({ ...prev, ...nextForm }));
      emitToast(t("Datos de cliente actualizados"));
    } catch (err: any) {
      setError(err.message || t("Error guardando datos del cliente"));
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

  const saveEditField = async (
    field: TenantFieldKey | null = editingField,
    draft: string = editingDraft,
  ) => {
    if (!field) {
      return;
    }
    const previousValue = tenantForm[field] ?? "";
    if (draft.trim() === String(previousValue || "").trim()) {
      if (field === editingField) {
        cancelEditField();
      }
      return;
    }
    const result = await Swal.fire({
      title: t("Confirmar cambios"),
      text: t("¿Guardar cambios en este campo?"),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("Guardar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      if (field === editingField) {
        cancelEditField();
      }
      return;
    }
    const nextForm = { ...tenantForm, [field]: draft };
    try {
      await handleSaveTenant(nextForm);
      if (field === editingField) {
        setEditingField(null);
        setEditingDraft("");
      }
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
            onBlur={(event) => {
              if (skipBlurConfirmRef.current) {
                skipBlurConfirmRef.current = false;
                return;
              }
              void saveEditField(field, event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                skipBlurConfirmRef.current = true;
                void saveEditField(field, event.currentTarget.value);
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
    if (!canCancelSubscription) {
      return;
    }
    if (mode === "now" && role !== "admin") {
      return;
    }
    const result = await Swal.fire({
      title: t("Confirmar suscripción"),
      text:
        mode === "now"
          ? t("¿Dar de baja inmediata a esta suscripción?")
          : t(
              "La cancelación pondrá fin a la suscripción antes de la próxima renovación. Los servicios adquiridos quedarán inactivos, se congelará el gasto y seguirán listados. Podrás reactivar la suscripción antes de la próxima fecha de renovación. Si la suscripción finaliza en su periodo, los servicios se desvincularán definitivamente.",
            ),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Confirmar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      return;
    }
    const startedAt = Date.now();
    try {
      setSubscriptionCreating(true);
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
      await refreshTenantServices();
      emitToast(t("Suscripción actualizada"));
    } catch (err: any) {
      setError(err.message || t("Error actualizando suscripción"));
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = 3000 - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      setSubscriptionCreating(false);
      setSubscriptionBusy(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!tenantId || !subscription) {
      return;
    }
    if (!canReactivateSubscription) {
      return;
    }
    const result = await Swal.fire({
      title: t("Reactivar suscripción"),
      text: t(
        "La suscripción volverá a estar activa y los servicios quedarán operativos inmediatamente. Podrás volver a cancelar antes del fin del periodo si lo necesitas.",
      ),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("Reactivar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      return;
    }
    const startedAt = Date.now();
    try {
      setSubscriptionCreating(true);
      setSubscriptionBusy(true);
      const updated = await api.updateTenantSubscription(tenantId, {
        cancelAtPeriodEnd: false,
      });
      setSubscriptionSummary(updated as SubscriptionSummary);
      setSubscriptionForm({
        period: updated.subscription.period,
        basePriceEur: Number(updated.subscription.basePriceEur || 0),
        serviceCodes: (updated.services || [])
          .filter((item: any) => item.status !== "pending_removal")
          .map((item: any) => item.serviceCode),
        cancelAtPeriodEnd: Boolean(updated.subscription.cancelAtPeriodEnd),
      });
      await refreshTenantServices();
      emitToast(t("Suscripción reactivada"));
    } catch (err: any) {
      setError(err.message || t("Error reactivando suscripción"));
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = 3000 - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      setSubscriptionCreating(false);
      setSubscriptionBusy(false);
    }
  };

  const handleDeleteSubscription = async () => {
    if (!tenantId) {
      return;
    }
    const result = await Swal.fire({
      title: t("Eliminar suscripción"),
      text: t(
        "Se eliminará la suscripción y todo el historial asociado (servicios, facturas y solicitudes). Esta acción no se puede deshacer.",
      ),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Eliminar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      setSubscriptionBusy(true);
      await api.deleteTenantSubscription(tenantId);
      setSubscriptionSummary(null);
      setTenantInvoices([]);
      setSubscriptionForm({
        period: "monthly",
        basePriceEur: 0,
        serviceCodes: [],
        cancelAtPeriodEnd: false,
      });
      emitToast(t("Suscripción eliminada"));
    } catch (err: any) {
      setError(err.message || t("Error eliminando suscripción"));
    } finally {
      setSubscriptionBusy(false);
    }
  };

  const handleCopy = async (value: string, label: string) => {
    await copyToClipboard(value, label);
  };

  const handleCreateApiKey = async () => {
    if (!tenantId || !newApiKeyName.trim()) {
      return;
    }
    try {
      setApiKeyBusy(true);
      const created = await api.createApiKey({
        name: newApiKeyName.trim(),
        tenantId,
      });
      if (created?.apiKey) {
        storeTenantApiKey(tenantId, created.apiKey);
        setCreatedApiKey(created.apiKey);
        await copyToClipboard(created.apiKey, "API key");
        emitToast(t("API key creada y copiada"));
      } else {
        emitToast(t("API key creada"));
      }
      const list = await api.listApiKeys();
      setApiKeys(
        (list as ApiKeySummary[]).filter((item) => item.tenantId === tenantId),
      );
    } catch (err: any) {
      setError(err.message || t("Error creando API key"));
    } finally {
      setApiKeyBusy(false);
    }
  };

  const handleCopyStoredApiKey = async () => {
    if (!storedApiKey) {
      emitToast(
        t("API key no disponible. Cópiala al crearla en API Keys."),
        "error",
      );
      return;
    }
    await copyToClipboard(storedApiKey, "API key");
  };

  const resetProviderForm = () => {
    setProviderForm({
      type: "openai",
      displayName: "",
      apiKey: "",
      baseUrl: "https://api.openai.com",
      endpoint: "",
      deployment: "",
      apiVersion: "2024-02-15-preview",
      accessKeyId: "",
      secretAccessKey: "",
      sessionToken: "",
      region: "us-east-1",
      modelId: "",
      projectId: "",
      location: "us-central1",
      gcpModel: "",
      serviceAccount: "",
      config: "{}",
      enabled: true,
    });
  };

  const openProviderModal = () => {
    resetProviderForm();
    setProviderModalOpen(true);
  };

  const handleCreateProvider = async () => {
    if (!tenantId) {
      return;
    }
    if (!providerForm.displayName.trim()) {
      emitToast(t("El displayName es obligatorio."), "error");
      return;
    }
    const providerType = providerForm.type.toLowerCase();
    if (providerType.includes("openai") && !providerType.includes("azure")) {
      if (!providerForm.apiKey.trim()) {
        emitToast(t("La API key es obligatoria."), "error");
        return;
      }
      if (!providerForm.baseUrl.trim()) {
        emitToast(t("La URL base es obligatoria."), "error");
        return;
      }
    }
    if (providerType.includes("azure")) {
      if (
        !providerForm.apiKey.trim() ||
        !providerForm.endpoint.trim() ||
        !providerForm.deployment.trim()
      ) {
        emitToast(t("apiKey, endpoint y deployment son obligatorios."), "error");
        return;
      }
    }
    if (providerType.includes("bedrock") || providerType.includes("aws")) {
      if (
        !providerForm.accessKeyId.trim() ||
        !providerForm.secretAccessKey.trim() ||
        !providerForm.modelId.trim()
      ) {
        emitToast(
          t("accessKeyId, secretAccessKey y modelId son obligatorios."),
          "error",
        );
        return;
      }
    }
    if (
      providerType.includes("vertex") ||
      providerType.includes("google") ||
      providerType.includes("gcp")
    ) {
      if (
        !providerForm.projectId.trim() ||
        !providerForm.gcpModel.trim() ||
        !providerForm.serviceAccount.trim()
      ) {
        emitToast(
          t("projectId, modelo y service account son obligatorios."),
          "error",
        );
        return;
      }
    }
    let config: Record<string, unknown> = {};
    if (providerForm.config) {
      try {
        config = JSON.parse(providerForm.config);
      } catch {
        emitToast(t("Config debe ser JSON válido."), "error");
        return;
      }
    }
    const baseUrl = providerForm.baseUrl.trim();
    let credentialsPayload: Record<string, unknown> = {};
    if (providerType.includes("azure")) {
      credentialsPayload = {
        apiKey: providerForm.apiKey.trim(),
        endpoint: providerForm.endpoint.trim(),
        deployment: providerForm.deployment.trim(),
        apiVersion: providerForm.apiVersion.trim() || "2024-02-15-preview",
      };
    } else if (
      providerType.includes("bedrock") ||
      providerType.includes("aws")
    ) {
      credentialsPayload = {
        accessKeyId: providerForm.accessKeyId.trim(),
        secretAccessKey: providerForm.secretAccessKey.trim(),
        sessionToken: providerForm.sessionToken.trim() || undefined,
        region: providerForm.region.trim() || "us-east-1",
        modelId: providerForm.modelId.trim(),
      };
    } else if (
      providerType.includes("vertex") ||
      providerType.includes("google") ||
      providerType.includes("gcp")
    ) {
      let serviceAccount: Record<string, unknown> = {};
      try {
        serviceAccount = JSON.parse(providerForm.serviceAccount);
      } catch {
        emitToast(t("Service account debe ser JSON válido."), "error");
        return;
      }
      credentialsPayload = {
        projectId: providerForm.projectId.trim(),
        location: providerForm.location.trim() || "us-central1",
        model: providerForm.gcpModel.trim(),
        serviceAccount,
      };
    } else {
      credentialsPayload = {
        apiKey: providerForm.apiKey.trim(),
        baseUrl,
        endpoint: baseUrl,
      };
    }
    try {
      setProviderBusy(true);
      const payload: any = {
        type: providerForm.type,
        displayName: providerForm.displayName.trim(),
        credentials: JSON.stringify(credentialsPayload),
        config,
        enabled: providerForm.enabled,
      };
      await api.createProvider(tenantId, payload);
      const list = await api.getProviders(tenantId);
      setProviders(list as Provider[]);
      setProviderModalOpen(false);
      emitToast(t("Provider creado"));
    } catch (err: any) {
      emitToast(err.message || t("Error creando provider"), "error");
    } finally {
      setProviderBusy(false);
    }
  };

  const openPolicyModal = () => {
    setPolicyForm({
      maxRequestsPerMinute: policy?.maxRequestsPerMinute ?? 60,
      maxTokensPerDay: policy?.maxTokensPerDay ?? 200000,
      maxCostPerDayUsd: policy?.maxCostPerDayUsd ?? 0,
      redactionEnabled: policy?.redactionEnabled ?? true,
      metadata: policy ? JSON.stringify(policy.metadata ?? {}, null, 2) : "{}",
    });
    setPolicyModalOpen(true);
  };

  const handleSavePolicy = async () => {
    if (!tenantId) {
      return;
    }
    let metadata: Record<string, unknown> = {};
    if (policyForm.metadata) {
      try {
        metadata = JSON.parse(policyForm.metadata);
      } catch (err) {
        emitToast(t("Metadata debe ser JSON válido."), "error");
        return;
      }
    }
    try {
      setPolicyBusy(true);
      const payload = {
        maxRequestsPerMinute: Number(policyForm.maxRequestsPerMinute),
        maxTokensPerDay: Number(policyForm.maxTokensPerDay),
        maxCostPerDayUsd: Number(policyForm.maxCostPerDayUsd),
        redactionEnabled: policyForm.redactionEnabled,
        metadata,
      };
      const updated = await api.upsertPolicy(tenantId, payload);
      setPolicy(updated as Policy);
      setPolicyModalOpen(false);
      emitToast(t("Política guardada"));
    } catch (err: any) {
      emitToast(err.message || t("Error guardando política"), "error");
    } finally {
      setPolicyBusy(false);
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
      emitToast(t("Pricing guardado"));
    } catch (err: any) {
      const message = err.message || t("Error guardando pricing");
      setError(message);
      emitToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const openPricingModal = () => {
    setPricingForm({
      providerType: "openai",
      model: "",
      inputCostPer1k: "",
      outputCostPer1k: "",
      enabled: true,
    });
    setPricingModalOpen(true);
  };

  const handleCreatePricing = async () => {
    if (!pricingForm.providerType.trim() || !pricingForm.model.trim()) {
      emitToast(t("Provider y modelo son obligatorios."), "error");
      return;
    }
    const inputCost = Number(pricingForm.inputCostPer1k);
    const outputCost = Number(pricingForm.outputCostPer1k);
    if (!Number.isFinite(inputCost) || !Number.isFinite(outputCost)) {
      emitToast(t("Costes deben ser numéricos."), "error");
      return;
    }
    try {
      setPricingBusy(true);
      const created = await api.createPricing({
        providerType: pricingForm.providerType.trim(),
        model: pricingForm.model.trim(),
        inputCostPer1k: inputCost,
        outputCostPer1k: outputCost,
        enabled: pricingForm.enabled,
      });
      const list = await api.getPricing();
      setPricing(list as PricingEntry[]);
      if (created?.id && !pricingSelection.includes(created.id)) {
        setPricingSelection((prev) => [...prev, created.id]);
      }
      setPricingModalOpen(false);
      emitToast(t("Pricing creado"));
    } catch (err: any) {
      emitToast(err.message || t("Error creando pricing"), "error");
    } finally {
      setPricingBusy(false);
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
      emitToast(t("Usuario de chat creado"));
    } catch (err: any) {
      setError(err.message || t("Error creando usuario de chat"));
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
      emitToast(t("Usuario actualizado"));
    } catch (err: any) {
      setError(err.message || t("Error actualizando usuario"));
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
      title: t("Confirmar acción"),
      text:
        nextStatus === "disabled"
          ? t("¿Desactivar este usuario de chat?")
          : t("¿Activar este usuario de chat?"),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("Confirmar"),
      cancelButtonText: t("Cancelar"),
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
      title: t("Eliminar usuario"),
      text: t("¿Eliminar este usuario de chat?"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Eliminar"),
      cancelButtonText: t("Cancelar"),
    });
    if (!result.isConfirmed) {
      return;
    }
    try {
      setChatBusy(true);
      await api.deleteChatUser(tenantId, id);
      setChatUsers((prev) => prev.filter((user) => user.id !== id));
      emitToast(t("Usuario eliminado"));
    } catch (err: any) {
      setError(err.message || t("Error eliminando usuario"));
    } finally {
      setChatBusy(false);
    }
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
      title:
        chatUserMode === "create"
          ? t("Crear usuario")
          : t("Guardar cambios"),
      text:
        chatUserMode === "create"
          ? t("¿Crear este usuario de chat?")
          : t("¿Guardar cambios en este usuario?"),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("Confirmar"),
      cancelButtonText: t("Cancelar"),
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
      emitToast(t("Usuario actualizado"));
    } catch (err: any) {
      setError(err.message || t("Error actualizando usuario"));
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
      label: t("Estado"),
      sortable: true,
      render: (user) => <StatusBadgeIcon status={user.status} />,
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

  type InvoiceRow = {
    id: string;
    period: string;
    totalEur: number;
    status: string;
    issuedAt: string;
    paidAt?: string | null;
    items: string;
  };

  const invoiceRows = useMemo<InvoiceRow[]>(
    () =>
      tenantInvoices.map((entry) => {
        const invoice = entry.invoice;
        const itemLabels =
          entry.items.length > 0
            ? entry.items.map((item) => item.serviceCode).join(", ")
            : "Suscripción base";
        return {
          id: invoice.id,
          period: invoice.period,
          totalEur: Number(invoice.totalEur || 0),
          status: invoice.status,
          issuedAt: invoice.issuedAt,
          paidAt: invoice.paidAt || null,
          items: itemLabels,
        };
      }),
    [tenantInvoices],
  );

  const invoiceEntryMap = useMemo(
    () =>
      new Map(
        tenantInvoices.map((entry) => [entry.invoice.id, entry] as const),
      ),
    [tenantInvoices],
  );

  const handleDownloadInvoice = (invoiceId: string) => {
    const entry = invoiceEntryMap.get(invoiceId);
    if (!entry) {
      emitToast(t("No se pudo generar la factura."), "error");
      return;
    }
    const { invoice, items } = entry;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    let y = 40;

    doc.setFillColor(230, 90, 50);
    doc.circle(margin + 8, y - 6, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("N", margin + 5.5, y - 2);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("NERIA", margin + 24, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Factura", pageWidth - margin - 60, y);
    y += 16;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;

    const neriaBilling = [
      "Neria AI, S.L.",
      "CIF: B-12345678",
      "Calle Gran Vía 123",
      "08010 Barcelona, España",
      "billing@neria.ai",
    ];
    const tenantBillingName =
      tenantForm.companyName ||
      tenantForm.name ||
      tenant?.name ||
      "Cliente";
    const tenantBilling = [
      tenantBillingName,
      tenantForm.billingEmail || "Email no definido",
      tenantForm.billingAddressLine1 || "Dirección no definida",
      [
        tenantForm.billingPostalCode,
        tenantForm.billingCity,
        tenantForm.billingCountry,
      ]
        .filter(Boolean)
        .join(" "),
    ].filter(Boolean);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Emisor", margin, y);
    doc.text("Cliente", pageWidth / 2 + 10, y);
    const rightStartY = y + 14;
    y += 14;
    doc.setFont("helvetica", "normal");
    neriaBilling.forEach((line) => {
      doc.text(line, margin, y);
      y += 12;
    });
    let rightY = rightStartY;
    tenantBilling.forEach((line) => {
      doc.text(line, pageWidth / 2 + 10, rightY);
      rightY += 12;
    });
    y = Math.max(y, rightY) + 8;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;

    const metaRows = [
      ["Factura ID", invoice.id],
      [
        "Fecha emisión",
        new Date(invoice.issuedAt).toLocaleDateString(),
      ],
      ["Periodo", invoice.period],
      ["Estado", invoice.status],
    ];
    doc.setFont("helvetica", "normal");
    metaRows.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), margin + 100, y);
      y += 12;
    });
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("Concepto", margin, y);
    doc.text("Importe", pageWidth - margin, y, { align: "right" });
    y += 10;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;

    const basePrice = Number(invoice.basePriceEur || 0);
    const lineItems: Array<[string, number]> = [];
    if (basePrice > 0) {
      lineItems.push(["Suscripción base", basePrice]);
    }
    items.forEach((item) => {
      lineItems.push([
        item.description || item.serviceCode,
        Number(item.priceEur || 0),
      ]);
    });
    lineItems.forEach(([label, amount]) => {
      doc.setFont("helvetica", "normal");
      doc.text(label, margin, y, { maxWidth: 300 });
      doc.text(formatEur(amount), pageWidth - margin, y, { align: "right" });
      y += 14;
      if (y > pageHeight - margin - 80) {
        doc.addPage();
        y = margin;
      }
    });

    const subtotal =
      lineItems.reduce((sum, [, amount]) => sum + amount, 0) ||
      Number(invoice.totalEur || 0);
    const taxRate = 0.21;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    y += 6;
    doc.setDrawColor(220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.text("Subtotal", pageWidth - margin - 140, y);
    doc.text(formatEur(subtotal), pageWidth - margin, y, { align: "right" });
    y += 14;
    doc.text(`Impuesto (${Math.round(taxRate * 100)}%)`, pageWidth - margin - 140, y);
    doc.text(formatEur(tax), pageWidth - margin, y, { align: "right" });
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.text("Total", pageWidth - margin - 140, y);
    doc.text(formatEur(total), pageWidth - margin, y, { align: "right" });

    doc.save(`factura-${invoice.id}.pdf`);
  };

  const invoiceColumns: DataTableColumn<InvoiceRow>[] = [
    {
      key: "issuedAt",
      label: "Fecha",
      sortable: true,
      render: (row) => new Date(row.issuedAt).toLocaleDateString(),
    },
    {
      key: "period",
      label: "Periodo",
      sortable: true,
    },
    {
      key: "items",
      label: "Servicios",
    },
    {
      key: "totalEur",
      label: "Total",
      sortable: true,
      render: (row) => formatEur(row.totalEur),
    },
    {
      key: "status",
      label: "Estado",
      sortable: true,
      render: (row) => <StatusBadgeIcon status={row.status} />,
    },
    {
      key: "download",
      label: "",
      render: (row) => (
        <div className="icon-actions">
          <button
            type="button"
            className="icon-button"
            title={t("Descargar PDF")}
            onClick={() => handleDownloadInvoice(row.id)}
          >
            ⤓
          </button>
        </div>
      ),
    },
  ];

  if (!tenantId) {
    return (
      <PageWithDocs slug="tenants">
        <div className="muted">{t("Selecciona un tenant para ver el resumen.")}</div>
      </PageWithDocs>
    );
  }

  return (
    <PageWithDocs slug="tenants">
      {error && <div className="error-banner">{error}</div>}
      <div className="tenant-detail-layout row">
        <div className="tenant-detail-summary col-md-3 col-xxl-4">
          <div className="card">
            <div>
              <h2>{t("Resumen")}</h2>
              <p className="muted">{t("Datos generales del cliente.")}</p>
            </div>
            {!tenant?.billingEmail && (
              <div className="info-banner">
                {t(
                  "Falta el email de facturación. Algunas acciones quedarán bloqueadas hasta completarlo.",
                )}
              </div>
            )}
            <div className="mini-list summary-list">
              <div className="mini-row">
                <span>ID</span>
                <span>{tenant?.id || tenantId}</span>
              </div>
              {renderEditableRow(
                t("Nombre"),
                "name",
                tenantForm.name,
                t("Nombre del cliente"),
              )}
              <div className="mini-row summary-inline-row">
                <span>{t("Estado")}</span>
                <StatusBadgeIcon status={tenant?.status || "active"} />
              </div>
              <div className="mini-row summary-inline-row">
                <span>{t("Kill switch")}</span>
                <span>{tenant?.killSwitch ? t("ON") : t("OFF")}</span>
              </div>
              {renderEditableRow(
                t("Email facturación"),
                "billingEmail",
                tenantForm.billingEmail || t("No definido"),
                t("billing@cliente.com"),
                "email",
              )}
              {renderEditableRow(
                t("Empresa"),
                "companyName",
                tenantForm.companyName,
                t("Razón social"),
              )}
              {renderEditableRow(
                t("Responsable"),
                "contactName",
                tenantForm.contactName,
                t("Nombre del responsable"),
              )}
              {renderEditableRow(
                t("Teléfono"),
                "phone",
                tenantForm.phone,
                t("+34 600 000 000"),
                "tel",
              )}
              {renderEditableRow(
                t("Web"),
                "website",
                tenantForm.website,
                t("https://cliente.com"),
              )}
              {renderEditableRow(
                t("CIF/NIF"),
                "taxId",
                tenantForm.taxId,
                t("B12345678"),
              )}
              {renderEditableRow(
                t("Dirección"),
                "addressLine1",
                tenantForm.addressLine1,
                t("Calle, número"),
              )}
              {renderEditableRow(
                t("Dirección (2)"),
                "addressLine2",
                tenantForm.addressLine2,
                t("Piso, puerta"),
              )}
              {renderEditableRow(t("Ciudad"), "city", tenantForm.city, t("Madrid"))}
              {renderEditableRow(
                t("Código postal"),
                "postalCode",
                tenantForm.postalCode,
                t("28001"),
              )}
              {renderEditableRow(
                t("País"),
                "country",
                tenantForm.country,
                t("España"),
              )}
              {renderEditableRow(
                t("Dirección facturación"),
                "billingAddressLine1",
                tenantForm.billingAddressLine1,
                t("Calle, número"),
              )}
              {renderEditableRow(
                t("Dirección facturación (2)"),
                "billingAddressLine2",
                tenantForm.billingAddressLine2,
                t("Piso, puerta"),
              )}
              {renderEditableRow(
                t("Ciudad facturación"),
                "billingCity",
                tenantForm.billingCity,
                t("Madrid"),
              )}
              {renderEditableRow(
                t("CP facturación"),
                "billingPostalCode",
                tenantForm.billingPostalCode,
                t("28001"),
              )}
              {renderEditableRow(
                t("País facturación"),
                "billingCountry",
                tenantForm.billingCountry,
                t("España"),
              )}
            </div>
          </div>
        </div>

        <div className="tenant-detail-content col-md-9 col-xxl-8">
          <section className="masonry tenant-detail-masonry">
            <div className="card">
              <h2>{t("Servicios habilitados")}</h2>
              <p className="muted tight">
                {t("Servicios incluidos en la suscripción actual.")}
              </p>
              <div className="chart-block">
                <Chart option={serviceOption} height={200} />
              </div>
              {contractedServices.length === 0 && (
                <div className="muted tight">
                  {t(
                    "No hay servicios contratados. Crea una suscripción para activar servicios.",
                  )}
                </div>
              )}
              {canManageSubscription && (
                <div className="mt-3">
                  <button
                    className="btn primary"
                    onClick={() => setAssignServicesModalOpen(true)}
                  >
                    {t("Asignar servicios")}
                  </button>
                </div>
              )}
            </div>

            {/* {!(isTenant && pricingSelection.length === 0) && (
              <div className="card">
                <div>
                  <h2>API Keys</h2>
                  <p className="muted ">Keys asociadas a este tenant.</p>
                </div>

                {canManageApiKeys && !canCreateApiKey && (
                  <div className="muted">
                    Para crear una API key necesitas tener provider, política y
                    pricing configurados.
                  </div>
                )}
                <div className="mini-list">
                  {apiKeys.map((key) => (
                    <div className="mini-row api-keys-row" key={key.id}>
                      <div className="row align-items-center">
                        <div className="col-9">
                          <div>{key.name}</div>
                        </div>
                        <div className="col-3 d-flex align-items-center justify-content-end">
                          <StatusBadgeIcon status={key.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {apiKeys.length === 0 && (
                  <div className="muted">Sin API keys.</div>
                )}
                <div className="form-grid">
                  <label>
                    API key actual
                    <div className="input-with-action">
                      <input
                        value={storedApiKey || "No disponible"}
                        readOnly
                      />
                      <button className="btn" onClick={handleCopyStoredApiKey}>
                        Copiar
                      </button>
                    </div>
                  </label>
                </div>

                {canManageApiKeys && (
                  <button
                    className="btn primary"
                    onClick={() => {
                      setNewApiKeyName("");
                      setCreatedApiKey(null);
                      setApiKeyModalOpen(true);
                    }}
                    disabled={!canCreateApiKey}
                  >
                    Crear API key
                  </button>
                )}
              </div>
            )} */}

            <div className="card">
              <h2>{t("Tendencia de uso")}</h2>
              <p className="muted tight">
                {t("Tokens y coste por día (últimos 7 días).")}
              </p>
              <Chart option={usageTrendOption} height={220} />
              <div className="chart-row">
                <div className="chart-metric">
                  <span className="muted">{t("Tokens 7d")}</span>
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
                  <span className="muted">{t("Coste 7d (USD/EUR)")}</span>
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
              <h2>{t("Uso (hoy)")}</h2>
              <p className="muted tight">{t("Resumen de consumo diario.")}</p>
              {usageSummary ? (
                <div className="mini-list">
                  <div className="mini-row usage-today-row">
                    <div className="row align-items-center">
                      <div className="col-6">{t("Tokens")}</div>
                      <div className="col-6 text-end">
                        {usageSummary.tokens}
                      </div>
                    </div>
                  </div>
                  <div className="mini-row usage-today-row">
                    <div className="row align-items-center">
                      <div className="col-6">{t("Coste USD")}</div>
                      <div className="col-6 text-end">
                        {formatUsdWithEur(usageSummary.costUsd)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="muted">{t("Sin datos de uso.")}</div>
              )}
            </div>

            <div className="card">
              <div>
                <h2>{t("Logs de uso")}</h2>
                <p className="muted">{t("Últimos eventos de consumo.")}</p>
              </div>

              <div className="mini-list usage-logs-list">
                {usageEvents.map((event) => (
                  <div className="mini-row usage-logs-row" key={event.id}>
                    <div className="row align-items-center">
                      <div className="col-6">
                        <div>{event.model}</div>
                        <div className="muted">
                          {event.serviceCode
                            ? serviceOverviewMap.get(event.serviceCode)?.name ||
                              event.serviceCode
                            : t("general")}
                        </div>
                      </div>
                      <div className="col-6 text-end">
                        <div>
                          {t("{count} tokens", {
                            count: event.tokensIn + event.tokensOut,
                          })}
                        </div>
                        <div className="muted">
                          {formatUsdWithEur(event.costUsd)}
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-12 muted">
                        {new Date(event.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {usageEvents.length === 0 && (
                <div className="muted">{t("Sin eventos de uso.")}</div>
              )}
              <a className="btn primary" href={`/clients/${tenantId}/usage`}>
                {t("Ver Usage")}
              </a>
            </div>

            <div className="card">
              <h2>{t("Auditoría")}</h2>
              <p className="muted tight">
                {t("Eventos de auditoría más recientes.")}
              </p>
              <div className="audit-list audit-list-scroll">
                {auditEvents.map((event) => (
                  <div className="audit-item" key={event.id}>
                    <div>
                      <div className="audit-action">{event.action}</div>
                      <div className="muted">
                        {new Date(event.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span className={`status ${event.status}`}>
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>
              {auditEvents.length === 0 && (
                <div className="muted">{t("Sin auditoría.")}</div>
              )}
            </div>

            <div className="card">
              <h2>{t("Observability")}</h2>
              <p className="muted tight">
                {t("Salud del provider, endpoints y alertas activas del tenant.")}
              </p>
              <a className="btn primary" href={`/clients/${tenantId}/observability`}>
                {t("Ver observability")}
              </a>
            </div>
          </section>
        </div>
      </div>

      <div className="tenant-detail-secondary">
        <div className="card full-width">
          <div className="card-header">
            <div>
              <h2>{t("Configuración del tenant")}</h2>
              <p className="muted ">
                {t(
                  "Providers, política, pricing, suscripción y facturación agrupados en un acordeón.",
                )}
              </p>
            </div>
          </div>
          <div className="accordion" id="tenant-detail-accordion">
            <div className="accordion-item" id="providers">
              <h2 className="accordion-header" id="tenant-acc-heading-1">
                <button
                  className={`accordion-button ${
                    activeAccordion === "tenant-acc-1" ? "" : "collapsed"
                  }`}
                  type="button"
                  onClick={() =>
                    setActiveAccordion((prev) =>
                      prev === "tenant-acc-1" ? "" : "tenant-acc-1",
                    )
                  }
                  aria-expanded={activeAccordion === "tenant-acc-1"}
                  aria-controls="tenant-acc-collapse-1"
                >
                  <span className="accordion-title-group">
                    <span className="accordion-title">{t("Providers")}</span>
                    <span className="accordion-desc muted">
                      {t("Proveedores registrados para este tenant.")}
                    </span>
                  </span>
                </button>
              </h2>
              <div
                id="tenant-acc-collapse-1"
                className={`accordion-collapse collapse ${
                  activeAccordion === "tenant-acc-1" ? "show" : ""
                }`}
                aria-labelledby="tenant-acc-heading-1"
                data-bs-parent="#tenant-detail-accordion"
              >
                <div className="accordion-body">
                  <div className="card-header">
                    <div></div>
                    {canManageProviders && (
                      <button
                        className="btn primary"
                        onClick={openProviderModal}
                      >
                        {t("Añadir provider")}
                      </button>
                    )}
                  </div>
                  <div className="mini-list">
                    {providers.map((provider) => (
                      <div className="mini-row" key={provider.id}>
                        <span>{provider.displayName}</span>
                        <span>{provider.type}</span>
                        <button
                          className="link"
                          onClick={() =>
                            handleCopy(provider.id, t("Provider ID"))
                          }
                        >
                          {t("Copiar ID")}
                        </button>
                        <span
                          className={`status ${
                            provider.enabled ? "active" : "disabled"
                          }`}
                        >
                          {provider.enabled ? t("active") : t("disabled")}
                        </span>
                      </div>
                    ))}
                  </div>
                  {providers.length === 0 && (
                    <div className="muted">{t("Sin providers.")}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="accordion-item" id="policies">
              <h2 className="accordion-header" id="tenant-acc-heading-2">
                <button
                  className={`accordion-button ${
                    activeAccordion === "tenant-acc-2" ? "" : "collapsed"
                  }`}
                  type="button"
                  onClick={() =>
                    setActiveAccordion((prev) =>
                      prev === "tenant-acc-2" ? "" : "tenant-acc-2",
                    )
                  }
                  aria-expanded={activeAccordion === "tenant-acc-2"}
                  aria-controls="tenant-acc-collapse-2"
                >
                  <span className="accordion-title-group">
                    <span className="accordion-title">{t("Políticas")}</span>
                    <span className="accordion-desc muted">
                      {t("Límites configurados para este tenant.")}
                    </span>
                  </span>
                </button>
              </h2>
              <div
                id="tenant-acc-collapse-2"
                className={`accordion-collapse collapse ${
                  activeAccordion === "tenant-acc-2" ? "show" : ""
                }`}
                aria-labelledby="tenant-acc-heading-2"
                data-bs-parent="#tenant-detail-accordion"
              >
                <div className="accordion-body">
                  <div className="card-header">
                    <div></div>
                    {canManagePolicies && (
                      <button className="btn primary" onClick={openPolicyModal}>
                        {policy ? t("Editar política") : t("Crear política")}
                      </button>
                    )}
                  </div>
                  {policy ? (
                    <div className="mini-list">
                      <div className="mini-row">
                        <span>{t("Req/min")}</span>
                        <span>{policy.maxRequestsPerMinute}</span>
                      </div>
                      <div className="mini-row">
                        <span>{t("Tokens/día")}</span>
                        <span>{policy.maxTokensPerDay}</span>
                      </div>
                      <div className="mini-row">
                        <span>{t("Coste diario (USD/EUR)")}</span>
                        <span>{formatUsdWithEur(policy.maxCostPerDayUsd)}</span>
                      </div>
                      <div className="mini-row">
                        <span>{t("Redacción")}</span>
                        <span>
                          {policy.redactionEnabled ? t("ON") : t("OFF")}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="muted">
                      {t("No hay política configurada.")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="accordion-item" id="pricing">
              <h2 className="accordion-header" id="tenant-acc-heading-3">
                <button
                  className={`accordion-button ${
                    activeAccordion === "tenant-acc-3" ? "" : "collapsed"
                  }`}
                  type="button"
                  onClick={() =>
                    setActiveAccordion((prev) =>
                      prev === "tenant-acc-3" ? "" : "tenant-acc-3",
                    )
                  }
                  aria-expanded={activeAccordion === "tenant-acc-3"}
                  aria-controls="tenant-acc-collapse-3"
                >
                  <span className="accordion-title-group">
                    <span className="accordion-title">{t("Pricing asociado")}</span>
                    {!(isTenant && pricingSelection.length === 0) && (
                      <span className="accordion-desc muted">
                        {t("Selecciona los modelos que aplican a este cliente.")}
                      </span>
                    )}
                  </span>
                </button>
              </h2>
              <div
                id="tenant-acc-collapse-3"
                className={`accordion-collapse collapse ${
                  activeAccordion === "tenant-acc-3" ? "show" : ""
                }`}
                aria-labelledby="tenant-acc-heading-3"
                data-bs-parent="#tenant-detail-accordion"
              >
                <div className="accordion-body">
                  <div className="card-header">
                    <div></div>
                    {canManagePricing && (
                      <button
                        className="btn primary"
                        onClick={openPricingModal}
                      >
                        {t("Crear pricing")}
                      </button>
                    )}
                  </div>
                  {isTenant && pricingSelection.length === 0 ? (
                    <div className="muted">{t("No hay pricing asociado.")}</div>
                  ) : (
                    <div className="form-grid">
                      {!isTenant && (
                        <div className="multiselect-wrapper pricing-selector">
                          <MultiSelectDropdown
                            options={pricingOptions}
                            selected={pricingSelection}
                            disabled={!canManagePricing}
                            placeholder={t("Selecciona pricing")}
                            maxHeight={260}
                            onChange={handlePricingSelectionChange}
                          />
                        </div>
                      )}
                      {selectedPricingEntries.length > 0 && (
                        <div className="mini-list full-row">
                          {selectedPricingEntries.map((entry) => (
                            <div key={entry.id} className="mini-row">
                              <span>{entry.providerType}</span>
                              <span>{entry.model}</span>
                              <span className="muted">
                                {formatUsdWithEur(entry.inputCostPer1k)}/
                                {formatUsdWithEur(entry.outputCostPer1k)}
                              </span>
                              <StatusBadgeIcon
                                status={entry.enabled ? "active" : "disabled"}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {canManagePricing && (
                        <div className="form-actions">
                          <button
                            className="btn primary"
                            onClick={handleSavePricing}
                            disabled={saving}
                          >
                            {t("Guardar pricings")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {pricing.length === 0 && !isTenant && (
                    <div className="muted">{t("Sin pricing.")}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="accordion-item" id="subscription">
              <h2 className="accordion-header" id="tenant-acc-heading-4">
                <button
                  className={`accordion-button ${
                    activeAccordion === "tenant-acc-4" ? "" : "collapsed"
                  }`}
                  type="button"
                  onClick={() =>
                    setActiveAccordion((prev) =>
                      prev === "tenant-acc-4" ? "" : "tenant-acc-4",
                    )
                  }
                  aria-expanded={activeAccordion === "tenant-acc-4"}
                  aria-controls="tenant-acc-collapse-4"
                >
                  <span className="accordion-title-group">
                    <span className="accordion-title">{t("Suscripción")}</span>
                    <span className="accordion-desc muted">
                      {t("Gestión de tarifa base y servicios incluidos.")}
                    </span>
                  </span>
                </button>
              </h2>
              <div
                id="tenant-acc-collapse-4"
                className={`accordion-collapse collapse ${
                  activeAccordion === "tenant-acc-4" ? "show" : ""
                }`}
                aria-labelledby="tenant-acc-heading-4"
                data-bs-parent="#tenant-detail-accordion"
              >
                <div className="accordion-body">
                  <div className="card-header">
                    <div></div>
                    {subscription && (
                      <span
                        className={`status ${subscription.status === "cancelled" ? "critical" : "active"}`}
                      >
                        {subscription.status}
                      </span>
                    )}
                  </div>
                  {subscriptionCreating ? (
                    <LoaderComponent label={t("Procesando suscripción...")} />
                  ) : (
                    <>
                      {!subscription && (
                        <>
                          <div className="muted">
                            {t("Este cliente aún no tiene suscripción.")}
                            {canManageSubscription
                              ? t(" Puedes crearla desde aquí.")
                              : t(" Contacta con un administrador para crearla.")}
                          </div>
                          {canManageSubscription && (
                            <div className="info-banner">
                              {t(
                                "Para crear la suscripción necesitas email de facturación, una API key activa y un precio base mayor que 0.",
                              )}
                            </div>
                          )}
                        </>
                      )}
                      {subscription && (
                        <div className="mini-list">
                          <div className="mini-row">
                            <span>{t("Periodo")}</span>
                            <span>{subscription.period}</span>
                          </div>
                          <div className="mini-row">
                            <span>{t("Inicio")}</span>
                            <span>
                              {new Date(
                                subscription.currentPeriodStart,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mini-row">
                            <span>{t("Renovación")}</span>
                            <span>
                              {new Date(
                                subscription.currentPeriodEnd,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mini-row">
                            <span>{t("Base")}</span>
                            <span>
                              {formatEur(
                                Number(subscription.basePriceEur || 0),
                              )}
                            </span>
                          </div>
                          {subscriptionSummary?.totals && (
                            <div className="mini-row">
                              <span>{t("Total actual")}</span>
                              <span>
                                {formatEur(subscriptionSummary.totals.totalEur)}
                              </span>
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
                              {t(
                                "Debes definir un email de facturación en el tenant para poder activar la suscripción.",
                              )}
                            </div>
                          )}
                          {!hasTenantApiKey && (
                            <div className="info-banner full-row">
                              {t(
                                "Necesitas una API key activa para asignar servicios o crear una suscripción.",
                              )}
                            </div>
                          )}
                          {subscription?.cancelAtPeriodEnd &&
                            !canReactivateSubscription && (
                              <div className="info-banner full-row">
                                {t(
                                  "La suscripción ya ha finalizado y no se puede reactivar.",
                                )}
                              </div>
                            )}
                          <div className="subscription-controls mt-3 mb-4 full-row">
                            <div className="subscription-label-row">
                              <span className="subscription-label">
                                {t("Periodo")}
                              </span>
                              <span className="subscription-label">
                                {t("Base € (mensual o anual según periodo)")}
                              </span>
                              <span className="subscription-label" />
                            </div>
                            <div className="subscription-input-row">
                              <select
                                value={subscriptionForm.period}
                                disabled={!canEditSubscription}
                                onChange={(event) =>
                                  setSubscriptionForm((prev) => ({
                                    ...prev,
                                    period: event.target.value as
                                      | "monthly"
                                      | "annual",
                                  }))
                                }
                              >
                                <option value="monthly">{t("monthly")}</option>
                                <option value="annual">{t("annual")}</option>
                              </select>
                              <input
                                type="number"
                                value={subscriptionForm.basePriceEur}
                                disabled={!canEditSubscription}
                                onChange={(event) =>
                                  setSubscriptionForm((prev) => ({
                                    ...prev,
                                    basePriceEur: Number(event.target.value),
                                  }))
                                }
                                placeholder="49"
                              />
                              <label className="checkbox-inline">
                                <input
                                  type="checkbox"
                                  checked={subscriptionForm.cancelAtPeriodEnd}
                                  disabled={!canEditSubscription}
                                  onChange={(event) =>
                                    setSubscriptionForm((prev) => ({
                                      ...prev,
                                      cancelAtPeriodEnd: event.target.checked,
                                    }))
                                  }
                                />
                                {t("Cancelar al final del periodo")}
                              </label>
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
                                !canEditSubscription ||
                                (subscription
                                  ? subscriptionBusy
                                  : !canReviewSubscription)
                              }
                            >
                              {subscription
                                ? t("Guardar suscripción")
                                : t("Revisar y confirmar")}
                            </button>
                            {subscription && (
                              <>
                                <button
                                  className="btn"
                                  onClick={() =>
                                    handleCancelSubscription("period")
                                  }
                                  disabled={
                                    subscriptionBusy ||
                                    subscription.cancelAtPeriodEnd
                                  }
                                >
                                  {t("Cancelar al final")}
                                </button>
                                {subscription.cancelAtPeriodEnd && (
                                  <button
                                    className="btn"
                                    onClick={handleReactivateSubscription}
                                    disabled={
                                      subscriptionBusy ||
                                      !canReactivateSubscription
                                    }
                                  >
                                    {t("Reactivar")}
                                  </button>
                                )}
                                <button
                                  className="btn danger"
                                  onClick={() =>
                                    handleCancelSubscription("now")
                                  }
                                  disabled={subscriptionBusy}
                                >
                                  {t("Dar de baja")}
                                </button>
                                {canDeleteSubscription && (
                                  <button
                                    className="btn danger"
                                    onClick={handleDeleteSubscription}
                                    disabled={subscriptionBusy}
                                  >
                                    {t("Eliminar suscripción")}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      {subscription && !canManageSubscription && (
                        <div className="form-grid">
                          <div className="info-banner full-row">
                            {t(
                              "No tienes permisos para modificar la suscripción. Puedes solicitar la cancelación al final del periodo si lo necesitas.",
                            )}
                          </div>
                          {subscription.cancelAtPeriodEnd && (
                            <div className="info-banner full-row">
                              {t(
                                "Esta suscripción ya está marcada para cancelarse al final del periodo actual.",
                              )}
                            </div>
                          )}
                          {subscription.cancelAtPeriodEnd &&
                            !canReactivateSubscription && (
                              <div className="info-banner full-row">
                                La suscripción ya ha finalizado y no se puede
                                reactivar.
                              </div>
                            )}
                          <div className="form-actions">
                            <button
                              className="btn"
                              onClick={() => handleCancelSubscription("period")}
                              disabled={
                                subscriptionBusy ||
                                subscription.cancelAtPeriodEnd
                              }
                            >
                              {t("Cancelar al final")}
                            </button>
                            {subscription.cancelAtPeriodEnd && (
                              <button
                                className="btn"
                                onClick={handleReactivateSubscription}
                                disabled={
                                  subscriptionBusy ||
                                  !canReactivateSubscription
                                }
                              >
                                {t("Reactivar")}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="accordion-item" id="invoices">
              <h2 className="accordion-header" id="tenant-acc-heading-5">
                <button
                  className={`accordion-button ${
                    activeAccordion === "tenant-acc-5" ? "" : "collapsed"
                  }`}
                  type="button"
                  onClick={() =>
                    setActiveAccordion((prev) =>
                      prev === "tenant-acc-5" ? "" : "tenant-acc-5",
                    )
                  }
                  aria-expanded={activeAccordion === "tenant-acc-5"}
                  aria-controls="tenant-acc-collapse-5"
                >
                  <span className="accordion-title-group">
                    <span className="accordion-title">
                      Documentos y facturación
                    </span>
                    <span className="accordion-desc muted">
                      Facturas de suscripciones temporales y servicios añadidos.
                    </span>
                  </span>
                </button>
              </h2>
              <div
                id="tenant-acc-collapse-5"
                className={`accordion-collapse collapse ${
                  activeAccordion === "tenant-acc-5" ? "show" : ""
                }`}
                aria-labelledby="tenant-acc-heading-5"
                data-bs-parent="#tenant-detail-accordion"
              >
                <div className="accordion-body">
                  <div className="card-header">
                    <div></div>
                  </div>
                  {invoiceRows.length === 0 ? (
                    <div className="muted">No hay facturas registradas.</div>
                  ) : (
                    <DataTable
                      columns={invoiceColumns}
                      data={invoiceRows}
                      getRowId={(row) => row.id}
                      pageSize={6}
                      filterKeys={["period", "status", "items"]}
                    />
                  )}
                </div>
              </div>
            </div>

            {/*
            <div className="accordion-item" id="acquired-services">
              <h2 className="accordion-header" id="tenant-acc-heading-7">
                <button
                  className={`accordion-button ${
                    activeAccordion === "tenant-acc-7" ? "" : "collapsed"
                  }`}
                  type="button"
                  onClick={() =>
                    setActiveAccordion((prev) =>
                      prev === "tenant-acc-7" ? "" : "tenant-acc-7",
                    )
                  }
                  aria-expanded={activeAccordion === "tenant-acc-7"}
                  aria-controls="tenant-acc-collapse-7"
                >
                  Servicios adquiridos
                </button>
              </h2>
              <div
                id="tenant-acc-collapse-7"
                className={`accordion-collapse collapse ${
                  activeAccordion === "tenant-acc-7" ? "show" : ""
                }`}
                aria-labelledby="tenant-acc-heading-7"
                data-bs-parent="#tenant-detail-accordion"
              >
                <div className="accordion-body">
                  <div>
                    <h2>Servicios adquiridos</h2>
                    <p className="muted">
                      Anexa servicios a la suscripción y configura endpoints si
                      aplica.
                    </p>
                  </div>
                  {!subscription && (
                    <div className="muted">
                      Crea una suscripción para añadir servicios.
                    </div>
                  )}
                  {subscription && !canManageSubscription && (
                    <div className="muted">
                      No tienes permisos para gestionar servicios.
                    </div>
                  )}
                  {subscription && canManageSubscription && (
                    <>
                      <div className="section-divider" />
                      <div>
                        <h3>Anexo de servicio</h3>
                        <p className="muted">
                          Añade un servicio a la suscripción. El importe se
                          reflejará en la factura de la suscripción.
                        </p>
                      </div>
                      {addonError && (
                        <div className="error-banner">{addonError}</div>
                      )}
                      {addonSelectOptions.length === 0 ? (
                        <div className="muted">
                          No hay servicios disponibles para anexar.
                        </div>
                      ) : (
                        <div className="form-grid">
                          <label className="full-row">
                            Servicio a añadir
                            <select
                              value={addonServiceCode}
                              onChange={(event) =>
                                setAddonServiceCode(event.target.value)
                              }
                            >
                              <option value="">Selecciona un servicio</option>
                              {addonSelectOptions.map((service) => (
                                <option
                                  key={service.serviceCode}
                                  value={service.serviceCode}
                                >
                                  {service.name} ·{" "}
                                  {formatEur(
                                    subscription.period === "annual"
                                      ? service.priceAnnualEur
                                      : service.priceMonthlyEur,
                                  )}
                                  {service.subscriptionStatus ===
                                  "pending_removal"
                                    ? " · restaurar"
                                    : ""}
                                </option>
                              ))}
                            </select>
                          </label>
                          {addonAlreadyAdded && (
                            <div className="info-banner full-row">
                              Este servicio ya está añadido a la suscripción.
                            </div>
                          )}
                          {addonService?.endpointsEnabled !== false && (
                            <div className="info-banner full-row">
                              Este servicio requiere endpoints. Para activar
                              endpoints insert es obligatorio configurar los
                              endpoints tras la contratación.
                            </div>
                          )}
                          <div className="form-actions">
                            <button
                              className="btn primary"
                              onClick={handleAddServiceAddon}
                              disabled={
                                addonBusy ||
                                !addonServiceCode ||
                                !hasTenantApiKey ||
                                addonAlreadyAdded
                              }
                            >
                              {addonBusy ? "Añadiendo..." : "Añadir servicio"}
                            </button>
                            {addonService?.endpointsEnabled !== false &&
                              addonService && (
                                <button
                                  className="btn"
                                  onClick={() =>
                                    setAddonEndpointsExpanded((prev) => !prev)
                                  }
                                  disabled={addonBusy}
                                >
                                  {addonEndpointsExpanded
                                    ? "Ocultar endpoints"
                                    : "Añadir endpoints"}
                                </button>
                              )}
                          </div>
                          {addonService?.endpointsEnabled !== false &&
                            addonService &&
                            addonEndpointsExpanded && (
                              <div className="endpoint-editor full-row">
                                <label className="full-row">
                                  Endpoints (JSON por línea con label)
                                  <textarea
                                    rows={3}
                                    placeholder='{"label":"Chat principal","method":"POST","path":"/v1/chat"}\n{"label":"Salud","method":"GET","path":"/health"}'
                                    value={addonEndpointsInput}
                                    onChange={(event) => {
                                      setAddonEndpointsInput(
                                        event.target.value,
                                      );
                                      if (addonEndpointsError) {
                                        setAddonEndpointsError(null);
                                      }
                                    }}
                                  />
                                </label>
                                {!addonAlreadyAdded && (
                                  <div className="info-banner full-row">
                                    Añade primero el servicio a la suscripción
                                    para guardar endpoints.
                                  </div>
                                )}
                                {addonEndpointsError && (
                                  <div className="error-banner full-row">
                                    {addonEndpointsError}
                                  </div>
                                )}
                                <div className="form-actions">
                                  <button
                                    className="btn primary"
                                    onClick={handleAddAddonEndpoints}
                                    disabled={
                                      addonEndpointsBusy ||
                                      !addonEndpointsInput.trim()
                                    }
                                  >
                                    {addonEndpointsBusy
                                      ? "Guardando..."
                                      : "Guardar endpoints"}
                                  </button>
                                </div>
                              </div>
                            )}
                        </div>
                      )}
                      {addonService && (
                        <>
                          <div className="info-banner">
                            Valores para configurar la app de terceros. Ellos se
                            encargarán de colocarlos en su `.env`. La API key
                            solo se muestra al crearla para poder copiarla.
                          </div>
                          <div className="kv-grid">
                            <div className="kv-item">
                              <span className="kv-label">URL de la API</span>
                              <span className="kv-value">
                                {addonEnvValues?.apiBaseUrl || "—"}
                              </span>
                            </div>
                            <div className="kv-item">
                              <span className="kv-label">API key</span>
                              <span className="kv-value kv-row">
                                <span className="kv-text">
                                  {addonEnvValues?.apiKey
                                    ? addonEnvValues.apiKey
                                    : hasTenantApiKey
                                      ? "API key activa (no visible)"
                                      : "No disponible"}
                                </span>
                                {addonEnvValues?.apiKey && (
                                  <button
                                    className="btn small"
                                    onClick={() =>
                                      handleCopy(
                                        addonEnvValues.apiKey,
                                        "API key",
                                      )
                                    }
                                  >
                                    Copiar
                                  </button>
                                )}
                              </span>
                            </div>
                            <div className="kv-item">
                              <span className="kv-label">Provider ID</span>
                              <span className="kv-value">
                                {addonEnvValues?.providerId || "—"}
                              </span>
                            </div>
                            <div className="kv-item">
                              <span className="kv-label">Model</span>
                              <span className="kv-value">
                                {addonEnvValues?.model || "—"}
                              </span>
                            </div>
                            <div className="kv-item">
                              <span className="kv-label">Tenant ID</span>
                              <span className="kv-value">
                                {addonEnvValues?.tenantId || "—"}
                              </span>
                            </div>
                            <div className="kv-item">
                              <span className="kv-label">Service ID</span>
                              <span className="kv-value kv-row">
                                <span className="kv-text">
                                  {addonEnvValues?.serviceId || "—"}
                                </span>
                                {addonEnvValues?.serviceId && (
                                  <button
                                    className="btn small"
                                    onClick={() =>
                                      handleCopy(
                                        addonEnvValues.serviceId,
                                        "Service ID",
                                      )
                                    }
                                  >
                                    Copiar
                                  </button>
                                )}
                              </span>
                            </div>
                            <div className="kv-item">
                              <span className="kv-label">Chat endpoint</span>
                              <span className="kv-value">
                                {addonEnvValues?.chatEndpoint || "—"}
                              </span>
                            </div>
                          </div>
                          {addonService.endpointsEnabled !== false ? (
                            addonEndpoints.length > 0 ? (
                              <div>
                                <div className="muted">
                                  Endpoints configurados (se listan con su
                                  método).
                                </div>
                                <div className="endpoint-list">
                                  {addonEndpoints.map((endpoint) => (
                                    <div
                                      className="endpoint-item"
                                      key={endpoint.id}
                                    >
                                      <span className="endpoint-method">
                                        {endpoint.method}
                                      </span>
                                      <span className="endpoint-path">
                                        {endpoint.path}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="info-banner">
                                Este servicio aún no tiene endpoints
                                configurados. Añádelos arriba en JSON con label,
                                una línea por endpoint.
                              </div>
                            )
                          ) : (
                            <div className="muted">
                              Este servicio no requiere endpoints.
                            </div>
                          )}
                          {canManageApiKeys && !createdApiKey && (
                            <div className="form-grid">
                              <button
                                className="btn"
                                onClick={() => {
                                  setNewApiKeyName(
                                    `Servicio ${addonService.name}`,
                                  );
                                  setCreatedApiKey(null);
                                  setApiKeyModalOpen(true);
                                }}
                              >
                                Generar API key
                              </button>
                              <p className="muted">
                                Estos datos sirven para configurar el chatbot en
                                la aplicación del cliente.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            */}
          </div>
        </div>

        <>
          <div className="card full-width">
            <div className="card-header">
              <div>
                <h2>{t("Servicios asignados")}</h2>
                <p className="muted">
                  {t(
                    "Configura parámetros y, si aplica, endpoints de cada servicio. Para gestionar un servicio, pulse en \"Gestionar\" para abrir la página detalles del servicio.",
                  )}
                </p>
              </div>
            </div>
            {contractedServices.length === 0 ? (
              <div className="muted">{t("Sin servicios asignados.")}</div>
            ) : (
              <DataTable
                columns={[
                  { key: "name", label: t("Servicio"), sortable: true },
                  {
                    key: "price",
                    label: t("Precio"),
                    sortable: true,
                    render: (service: TenantServiceOverview) =>
                      formatEur(
                        subscription?.period === "annual"
                          ? service.priceAnnualEur
                          : service.priceMonthlyEur,
                      ),
                  },
                  {
                    key: "subscriptionStatus",
                    label: t("Estado"),
                    sortable: true,
                    render: (service: TenantServiceOverview) => {
                      const status = service.subscriptionStatus || "disabled";
                      const activateAt = service.activateAt
                        ? new Date(service.activateAt).toLocaleDateString()
                        : null;
                      const deactivateAt = service.deactivateAt
                        ? new Date(service.deactivateAt).toLocaleDateString()
                        : null;
                      const label =
                        status === "pending"
                          ? `${t("pendiente")}${activateAt ? ` · ${activateAt}` : ""}`
                          : status === "pending_removal"
                            ? `${t("baja pendiente")}${deactivateAt ? ` · ${deactivateAt}` : ""}`
                            : status;
                      return (
                        <StatusBadgeIcon
                          status={status === "active" ? "active" : "disabled"}
                          title={label}
                        />
                      );
                    },
                  },
                  {
                    key: "configScope",
                    label: t("LLM"),
                    render: (service: TenantServiceOverview) => {
                      const hasOverride = Boolean(
                        service.providerId ||
                        service.pricingId ||
                        service.policyId,
                      );
                      return (
                        <span
                          className={`pill ${hasOverride ? "pill-alt" : ""}`}
                        >
                          {hasOverride ? t("Override") : t("Global")}
                        </span>
                      );
                    },
                  },
                  {
                    key: "configStatus",
                    label: t("Operativo"),
                    sortable: true,
                    render: (service: TenantServiceOverview) => (
                      <span
                        className={`status ${
                          service.configStatus === "suspended"
                            ? "critical"
                            : "active"
                        }`}
                      >
                        {service.configStatus === "suspended"
                          ? t("suspendido")
                          : t("activo")}
                      </span>
                    ),
                  },
                  {
                    key: "userCount",
                    label: t("Usuarios"),
                    sortable: true,
                    render: (service: TenantServiceOverview) =>
                      t("{count} usuarios", { count: service.userCount }),
                  },
                  {
                    key: "endpointCount",
                    label: t("Endpoints"),
                    sortable: true,
                    render: (service: TenantServiceOverview) =>
                      service.endpointsEnabled !== false
                        ? t("{count} endpoints", { count: service.endpointCount })
                        : t("No aplica"),
                  },
                  {
                    key: "actions",
                    label: t("Acciones"),
                    render: (service: TenantServiceOverview) => (
                      <div className="row-actions">
                        {canManageServices && (
                          <button
                            className="link"
                            type="button"
                            onClick={() =>
                              navigate(
                                `/clients/${tenantId}/services/${service.serviceCode}`,
                              )
                            }
                          >
                            {t("Gestionar")}
                          </button>
                        )}
                        {canManageSubscription && (
                          <button
                            className="link"
                            type="button"
                            onClick={() => handleUnassignService(service)}
                            disabled={serviceRemoveBusy}
                          >
                            {t("Desasignar")}
                          </button>
                        )}
                        {canDeleteServiceAssignment && (
                          <button
                            className="link danger"
                            type="button"
                            onClick={() =>
                              handleDeleteServiceAssignment(service)
                            }
                            disabled={serviceRemoveBusy}
                          >
                            {t("Eliminar")}
                          </button>
                        )}
                      </div>
                    ),
                  },
                ]}
                data={contractedServices}
                getRowId={(service) => service.serviceCode}
                pageSize={6}
                filterKeys={["name", "serviceCode", "subscriptionStatus"]}
              />
            )}
          </div>
          <div className="card full-width">
            <div className="card-header">
              <div>
                <h2>{t("Usuarios de chat")}</h2>
                <p className="muted">
                  {t(
                    "Gestiona todos los usuarios creados para todos los servicios. Para ver los de un servicio concreto, es necesario ir a la página de ese servicio.",
                  )}
                </p>
              </div>
            </div>
            <DataTable
              columns={chatUserColumns}
              data={chatUsers}
              getRowId={(user) => user.id}
              pageSize={6}
              filterKeys={["name", "email", "status"]}
            />
            {chatUsers.length === 0 && (
              <div className="muted">{t("Sin usuarios creados.")}</div>
            )}
          </div>
        </>
      </div>

      {assignServicesModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setAssignServicesModalOpen(false)}
        >
          <div
            className="modal modal-wide"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">{t("Servicios")}</div>
                <h3>{t("Asignar servicios")}</h3>
              </div>
              <button
                className="btn"
                onClick={() => setAssignServicesModalOpen(false)}
              >
                {t("Cerrar")}
              </button>
            </div>
            <div className="modal-body">
              <div>
                <h3>{t("Anexo de servicio")}</h3>
                <p className="muted">
                  {t(
                    "Añade un servicio a la suscripción. El importe se reflejará en la factura de la suscripción.",
                  )}
                </p>
              </div>
              {!subscription && (
                <div className="muted">
                  {t("Crea una suscripción para añadir servicios.")}
                </div>
              )}
              {subscription && !canManageSubscription && (
                <div className="muted">
                  {t("No tienes permisos para gestionar servicios.")}
                </div>
              )}
              {subscription && canManageSubscription && (
                <>
                  {addonError && (
                    <div className="error-banner">{addonError}</div>
                  )}
                  {addonSelectOptions.length === 0 ? (
                    <div className="muted">
                      No hay servicios disponibles para anexar.
                    </div>
                  ) : (
                    <div className="form-grid">
                      <label className="full-row">
                        {t("Servicio a añadir")}
                        <select
                          value={addonServiceCode}
                          onChange={(event) =>
                            setAddonServiceCode(event.target.value)
                          }
                        >
                          <option value="">{t("Selecciona un servicio")}</option>
                          {addonSelectOptions.map((service) => (
                            <option
                              key={service.serviceCode}
                              value={service.serviceCode}
                            >
                              {service.name} ·{" "}
                              {formatEur(
                                subscription.period === "annual"
                                  ? service.priceAnnualEur
                                  : service.priceMonthlyEur,
                              )}
                              {service.subscriptionStatus === "pending_removal"
                                ? t(" · restaurar")
                                : ""}
                            </option>
                          ))}
                        </select>
                      </label>
                      {addonAlreadyAdded && (
                        <div className="info-banner full-row">
                          {t("Este servicio ya está añadido a la suscripción.")}
                        </div>
                      )}
                      {addonService?.endpointsEnabled !== false && (
                        <div className="info-banner full-row">
                          {t(
                            "Este servicio requiere endpoints. Para activar endpoints insert es obligatorio configurar los endpoints tras la contratación.",
                          )}
                        </div>
                      )}
                      <div className="form-actions">
                        <button
                          className="btn primary"
                          onClick={handleAddServiceAddon}
                          disabled={
                            addonBusy ||
                            !addonServiceCode ||
                            !hasTenantApiKey ||
                            addonAlreadyAdded
                          }
                        >
                          {addonBusy ? "Añadiendo..." : "Añadir servicio"}
                        </button>
                        {addonService?.endpointsEnabled !== false &&
                          addonService && (
                            <button
                              className="btn"
                              onClick={() =>
                                setAddonEndpointsExpanded((prev) => !prev)
                              }
                              disabled={addonBusy}
                            >
                              {addonEndpointsExpanded
                                ? "Ocultar endpoints"
                                : "Añadir endpoints"}
                            </button>
                          )}
                      </div>
                      {addonService?.endpointsEnabled !== false &&
                        addonService &&
                        addonEndpointsExpanded && (
                          <div className="endpoint-editor full-row">
                            <label className="full-row">
                              Endpoints (JSON por línea con label)
                              <textarea
                                rows={3}
                                placeholder='{"label":"Chat principal","method":"POST","path":"/v1/chat"}\n{"label":"Salud","method":"GET","path":"/health"}'
                                value={addonEndpointsInput}
                                onChange={(event) => {
                                  setAddonEndpointsInput(event.target.value);
                                  if (addonEndpointsError) {
                                    setAddonEndpointsError(null);
                                  }
                                }}
                              />
                            </label>
                            {!addonAlreadyAdded && (
                              <div className="info-banner full-row">
                                Añade primero el servicio a la suscripción para
                                guardar endpoints.
                              </div>
                            )}
                            {addonEndpointsError && (
                              <div className="error-banner full-row">
                                {addonEndpointsError}
                              </div>
                            )}
                            <div className="form-actions">
                              <button
                                className="btn primary"
                                onClick={handleAddAddonEndpoints}
                                disabled={
                                  addonEndpointsBusy ||
                                  !addonEndpointsInput.trim()
                                }
                              >
                                {addonEndpointsBusy
                                  ? "Guardando..."
                                  : "Guardar endpoints"}
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                  {addonService && (
                    <>
                      <div className="info-banner">
                        Valores para configurar la app de terceros. Ellos se
                        encargarán de colocarlos en su `.env`. La API key solo
                        se muestra al crearla para poder copiarla.
                      </div>
                      <div className="kv-grid">
                        <div className="kv-item">
                          <span className="kv-label">URL de la API</span>
                          <span className="kv-value">
                            {addonEnvValues?.apiBaseUrl || "—"}
                          </span>
                        </div>
                        <div className="kv-item">
                          <span className="kv-label">API key</span>
                          <span className="kv-value kv-row">
                            <span className="kv-text">
                              {addonEnvValues?.apiKey
                                ? addonEnvValues.apiKey
                                : hasTenantApiKey
                                  ? "API key activa (no visible)"
                                  : "No disponible"}
                            </span>
                            {addonEnvValues?.apiKey && (
                              <button
                                className="btn small"
                                onClick={() =>
                                  handleCopy(addonEnvValues.apiKey, "API key")
                                }
                              >
                                Copiar
                              </button>
                            )}
                          </span>
                        </div>
                        <div className="kv-item">
                          <span className="kv-label">Provider ID</span>
                          <span className="kv-value">
                            {addonEnvValues?.providerId || "—"}
                          </span>
                        </div>
                        <div className="kv-item">
                          <span className="kv-label">Model</span>
                          <span className="kv-value">
                            {addonEnvValues?.model || "—"}
                          </span>
                        </div>
                        <div className="kv-item">
                          <span className="kv-label">Tenant ID</span>
                          <span className="kv-value">
                            {addonEnvValues?.tenantId || "—"}
                          </span>
                        </div>
                        <div className="kv-item">
                          <span className="kv-label">Service ID</span>
                          <span className="kv-value kv-row">
                            <span className="kv-text">
                              {addonEnvValues?.serviceId || "—"}
                            </span>
                            {addonEnvValues?.serviceId && (
                              <button
                                className="btn small"
                                onClick={() =>
                                  handleCopy(
                                    addonEnvValues.serviceId,
                                    "Service ID",
                                  )
                                }
                              >
                                Copiar
                              </button>
                            )}
                          </span>
                        </div>
                        <div className="kv-item">
                          <span className="kv-label">Chat endpoint</span>
                          <span className="kv-value">
                            {addonEnvValues?.chatEndpoint || "—"}
                          </span>
                        </div>
                      </div>
                      {addonService.endpointsEnabled !== false ? (
                        addonEndpoints.length > 0 ? (
                          <div>
                            <div className="muted">
                              Endpoints configurados (se listan con su método).
                            </div>
                            <div className="endpoint-list">
                              {addonEndpoints.map((endpoint) => (
                                <div
                                  className="endpoint-item"
                                  key={endpoint.id}
                                >
                                  <span className="endpoint-method">
                                    {endpoint.method}
                                  </span>
                                  <span className="endpoint-path">
                                    {endpoint.path}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="info-banner">
                            Este servicio aún no tiene endpoints configurados.
                            Añádelos arriba en JSON con label, una línea por
                            endpoint.
                          </div>
                        )
                      ) : (
                        <div className="muted">
                          Este servicio no requiere endpoints.
                        </div>
                      )}
                      {canManageApiKeys && !createdApiKey && (
                        <div className="form-grid">
                          <button
                            className="btn"
                            onClick={() => {
                              setNewApiKeyName(`Servicio ${addonService.name}`);
                              setCreatedApiKey(null);
                              setApiKeyModalOpen(true);
                            }}
                          >
                            Generar API key
                          </button>
                          <p className="muted">
                            Estos datos sirven para configurar el chatbot en la
                            aplicación del cliente.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {serviceModalOpen && activeService && (
        <div className="modal-backdrop" onClick={closeServiceModal}>
          <div
            className="modal modal-wide"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="eyebrow">Servicio</div>
                <h3>{activeService.name}</h3>
                <p className="muted">{activeService.description}</p>
              </div>
              <button className="btn" onClick={closeServiceModal}>
                Cerrar
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  Estado operativo
                  <select
                    value={serviceConfigDraft.status}
                    onChange={(event) =>
                      setServiceConfigDraft((prev) => ({
                        ...prev,
                        status: event.target.value as "active" | "suspended",
                      }))
                    }
                  >
                    <option value="active">active</option>
                    <option value="suspended">suspended</option>
                  </select>
                </label>
                <label className="full-row">
                  Prompt de comportamiento (aplica a todo el servicio)
                  <textarea
                    value={serviceConfigDraft.systemPrompt}
                    onChange={(event) =>
                      setServiceConfigDraft((prev) => ({
                        ...prev,
                        systemPrompt: event.target.value,
                      }))
                    }
                    placeholder={t(
                      "Define el estilo del asistente, tono y reglas...",
                    )}
                  />
                </label>
                <label>
                  Provider (opcional)
                  <select
                    value={serviceConfigDraft.providerId}
                    onChange={(event) =>
                      setServiceConfigDraft((prev) => ({
                        ...prev,
                        providerId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Usar provider global</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.displayName} · {provider.type}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Pricing (opcional)
                  <select
                    value={serviceConfigDraft.pricingId}
                    onChange={(event) =>
                      setServiceConfigDraft((prev) => ({
                        ...prev,
                        pricingId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Usar pricing global</option>
                    {pricing.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.providerType} · {entry.model}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Política (opcional)
                  <select
                    value={serviceConfigDraft.policyId}
                    onChange={(event) =>
                      setServiceConfigDraft((prev) => ({
                        ...prev,
                        policyId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Usar política global</option>
                    {policyCatalog.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.id.slice(0, 8)} · {entry.maxRequestsPerMinute}
                        /min
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-actions">
                <button
                  className="btn primary"
                  onClick={handleSaveServiceConfig}
                  disabled={serviceBusy}
                >
                  Guardar configuración
                </button>
              </div>

              <div className="section-divider" />

              <h4>
                <span className="label-with-tooltip">
                  {t("Prueba runtime del servicio")}
                  <InfoTooltip
                    text={t(
                      "Ejecuta una petición de prueba con el provider y modelo seleccionados. Usa la API key del tenant y muestra la respuesta cruda del runtime para validar credenciales, configuración y conexión.",
                    )}
                  />
                </span>
              </h4>
              {!hasTenantApiKey && (
                <div className="info-banner">
                  {t("Necesitas una API key activa para ejecutar runtime.")}
                </div>
              )}
              <div className="form-grid">
                <label>
                  {t("Provider")}
                  <select
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
                    <option value="">{t("Selecciona provider")}</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.displayName} · {provider.type}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("Modelo")}
                  <input
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
                <label className="full-row">
                  {t("Payload JSON")}
                  <textarea
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
              <div className="form-actions">
                <button
                  className="btn primary"
                  onClick={handleServiceRuntimeTest}
                  disabled={serviceRuntimeBusy || !hasTenantApiKey}
                >
                  {t("Ejecutar runtime")}
                </button>
                {serviceRuntimeBusy && (
                  <span className="muted">{t("Ejecutando...")}</span>
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

              {activeService?.endpointsEnabled !== false ? (
                <>
                  <h4>Endpoints del servicio</h4>
                  <div className="form-grid">
                    <label>
                      Slug
                      <input
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
                    <label>
                      Método
                      <select
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
                    <label>
                      Path
                      <input
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
                    <label>
                      Base URL (opcional)
                      <input
                        value={serviceEndpointDraft.baseUrl}
                        onChange={(event) =>
                          setServiceEndpointDraft((prev) => ({
                            ...prev,
                            baseUrl: event.target.value,
                          }))
                        }
                        placeholder="https://api.cliente.com"
                      />
                    </label>
                    <label className="full-row">
                      Headers JSON (opcional)
                      <textarea
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
                    <label>
                      Activo
                      <input
                        type="checkbox"
                        checked={serviceEndpointDraft.enabled}
                        onChange={(event) =>
                          setServiceEndpointDraft((prev) => ({
                            ...prev,
                            enabled: event.target.checked,
                          }))
                        }
                      />
                    </label>
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

              <h4>Usuarios asignados</h4>
              <div className="form-grid">
                <label>
                  Asignar usuario existente
                  <select
                    value={serviceAssignUserId}
                    onChange={(event) =>
                      setServiceAssignUserId(event.target.value)
                    }
                  >
                    <option value="">Selecciona un usuario</option>
                    {availableServiceUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="form-actions">
                  <button
                    className="btn primary"
                    onClick={handleAssignServiceUser}
                    disabled={serviceBusy || !serviceAssignUserId}
                  >
                    Asignar
                  </button>
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
                    render: (row: any) => (
                      <StatusBadgeIcon status={row.status} />
                    ),
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
                        >
                          {row.status === "active" ? "Suspender" : "Activar"}
                        </button>
                        <button
                          className="link danger"
                          onClick={() => handleRemoveServiceUser(row)}
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
            </div>
          </div>
        </div>
      )}

      {canManageChatUsers && chatUserModalOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-dialog modal-dialog-centered"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-content">
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
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => setChatUserModalOpen(false)}
                />
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
                      placeholder={t("María López")}
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
                      placeholder={t("usuario@cliente.com")}
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
              <div className="modal-footer">
                <button
                  className="btn"
                  onClick={() => setChatUserModalOpen(false)}
                >
                  Cancelar
                </button>
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
        </div>
      )}

      {canManageProviders && providerModalOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-dialog modal-dialog-centered modal-wide"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <div className="eyebrow">Provider</div>
                  <h3>Asignar proveedor al tenant</h3>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => setProviderModalOpen(false)}
                />
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <label>
                    Proveedor
                    <select
                      value={providerForm.type}
                      onChange={(event) =>
                        setProviderForm((prev) => ({
                          ...prev,
                          type: event.target.value,
                        }))
                      }
                    >
                      <option value="openai">OpenAI</option>
                      <option value="azure-openai">Azure OpenAI</option>
                      <option value="aws-bedrock">AWS Bedrock</option>
                      <option value="google-vertex">Google Vertex</option>
                      <option value="mock">Mock</option>
                    </select>
                  </label>
                  <label>
                    Display name
                    <input
                      placeholder={t("OpenAI Cliente X")}
                      value={providerForm.displayName}
                      onChange={(event) =>
                        setProviderForm((prev) => ({
                          ...prev,
                          displayName: event.target.value,
                        }))
                      }
                    />
                  </label>
                  {providerForm.type === "openai" && (
                    <>
                      <label>
                        API key del provider
                        <input
                          placeholder="sk-..."
                          value={providerForm.apiKey}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              apiKey: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        URL base de la API
                        <input
                          placeholder="https://api.openai.com"
                          value={providerForm.baseUrl}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              baseUrl: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </>
                  )}
                  {providerForm.type === "azure-openai" && (
                    <>
                      <label>
                        API key del provider
                        <input
                          placeholder="api key"
                          value={providerForm.apiKey}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              apiKey: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Endpoint
                        <input
                          placeholder="https://<recurso>.openai.azure.com"
                          value={providerForm.endpoint}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              endpoint: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Deployment
                        <input
                          placeholder="gpt-4o-mini"
                          value={providerForm.deployment}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              deployment: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        API version
                        <input
                          placeholder="2024-02-15-preview"
                          value={providerForm.apiVersion}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              apiVersion: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </>
                  )}
                  {(providerForm.type === "aws-bedrock" ||
                    providerForm.type === "aws") && (
                    <>
                      <label>
                        Access key ID
                        <input
                          placeholder="accessKeyId"
                          value={providerForm.accessKeyId}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              accessKeyId: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Secret access key
                        <input
                          placeholder="secretAccessKey"
                          value={providerForm.secretAccessKey}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              secretAccessKey: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Session token (opcional)
                        <input
                          placeholder="sessionToken"
                          value={providerForm.sessionToken}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              sessionToken: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Región
                        <input
                          placeholder="us-east-1"
                          value={providerForm.region}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              region: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Model ID
                        <input
                          placeholder="anthropic.claude-3-haiku-20240307-v1:0"
                          value={providerForm.modelId}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              modelId: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </>
                  )}
                  {(providerForm.type === "google-vertex" ||
                    providerForm.type === "google" ||
                    providerForm.type === "gcp") && (
                    <>
                      <label>
                        Project ID
                        <input
                          placeholder="projectId"
                          value={providerForm.projectId}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              projectId: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Location
                        <input
                          placeholder="us-central1"
                          value={providerForm.location}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              location: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Modelo
                        <input
                          placeholder="gemini-1.5-pro"
                          value={providerForm.gcpModel}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              gcpModel: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Service account (JSON)
                        <textarea
                          placeholder="service account JSON"
                          value={providerForm.serviceAccount}
                          onChange={(event) =>
                            setProviderForm((prev) => ({
                              ...prev,
                              serviceAccount: event.target.value,
                            }))
                          }
                          rows={4}
                        />
                      </label>
                    </>
                  )}
                  <label>
                    Configuración extra (JSON)
                    <textarea
                      placeholder='{"model":"gpt-4o-mini"}'
                      value={providerForm.config}
                      onChange={(event) =>
                        setProviderForm((prev) => ({
                          ...prev,
                          config: event.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={providerForm.enabled}
                      onChange={(event) =>
                        setProviderForm((prev) => ({
                          ...prev,
                          enabled: event.target.checked,
                        }))
                      }
                    />
                    Provider habilitado
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn primary"
                  onClick={handleCreateProvider}
                  disabled={providerBusy}
                >
                  Guardar provider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {canManagePolicies && policyModalOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-dialog modal-dialog-centered"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <div className="eyebrow">Política</div>
                  <h3>{policy ? "Editar política" : "Crear política"}</h3>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => setPolicyModalOpen(false)}
                />
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <label>
                    Req/min
                    <input
                      type="number"
                      value={policyForm.maxRequestsPerMinute}
                      onChange={(event) =>
                        setPolicyForm((prev) => ({
                          ...prev,
                          maxRequestsPerMinute: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label>
                    Tokens/día
                    <input
                      type="number"
                      value={policyForm.maxTokensPerDay}
                      onChange={(event) =>
                        setPolicyForm((prev) => ({
                          ...prev,
                          maxTokensPerDay: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label>
                    Coste diario USD
                    <input
                      type="number"
                      value={policyForm.maxCostPerDayUsd}
                      onChange={(event) =>
                        setPolicyForm((prev) => ({
                          ...prev,
                          maxCostPerDayUsd: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={policyForm.redactionEnabled}
                      onChange={(event) =>
                        setPolicyForm((prev) => ({
                          ...prev,
                          redactionEnabled: event.target.checked,
                        }))
                      }
                    />
                    Redacción habilitada
                  </label>
                  <label>
                    Metadata (JSON)
                    <textarea
                      rows={4}
                      value={policyForm.metadata}
                      onChange={(event) =>
                        setPolicyForm((prev) => ({
                          ...prev,
                          metadata: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn primary"
                  onClick={handleSavePolicy}
                  disabled={policyBusy}
                >
                  Guardar política
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {canManagePricing && pricingModalOpen && (
        <div className="modal-backdrop">
          <div
            className="modal-dialog modal-dialog-centered"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <div className="eyebrow">Pricing</div>
                  <h3>Crear pricing</h3>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Cerrar"
                  onClick={() => setPricingModalOpen(false)}
                />
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <label>
                    Provider
                    <input
                      placeholder={t("providerType (ej: openai)")}
                      value={pricingForm.providerType}
                      onChange={(event) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          providerType: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Modelo
                    <input
                      placeholder={t("model (ej: gpt-4o-mini)")}
                      value={pricingForm.model}
                      onChange={(event) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          model: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Coste input / 1k
                    <input
                      type="number"
                      value={pricingForm.inputCostPer1k}
                      onChange={(event) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          inputCostPer1k: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    Coste output / 1k
                    <input
                      type="number"
                      value={pricingForm.outputCostPer1k}
                      onChange={(event) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          outputCostPer1k: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={pricingForm.enabled}
                      onChange={(event) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          enabled: event.target.checked,
                        }))
                      }
                    />
                    Pricing habilitado
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn primary"
                  onClick={handleCreatePricing}
                  disabled={pricingBusy}
                >
                  Guardar pricing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {canManageApiKeys && apiKeyModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setApiKeyModalOpen(false)}
        >
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="eyebrow">API Key</div>
                <h3>Crear API key del tenant</h3>
              </div>
              <button className="btn" onClick={() => setApiKeyModalOpen(false)}>
                Cerrar
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label>
                  Nombre de la key
                  <input
                    value={newApiKeyName}
                    onChange={(event) => setNewApiKeyName(event.target.value)}
                    placeholder={t("API producción")}
                  />
                </label>
                <div className="muted">
                  Guárdala ahora: por seguridad no se podrá recuperar después.
                </div>
                {createdApiKey && (
                  <label>
                    API key generada
                    <div className="input-with-action">
                      <input value={createdApiKey} readOnly />
                      <button
                        className="btn"
                        onClick={() => handleCopy(createdApiKey, "API key")}
                      >
                        Copiar
                      </button>
                    </div>
                  </label>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn primary"
                onClick={handleCreateApiKey}
                disabled={
                  apiKeyBusy || !newApiKeyName.trim() || !canCreateApiKey
                }
              >
                Crear API key
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
                  <span>API key activa</span>
                  <span>{activeApiKey ? "Sí" : "No"}</span>
                  {activeApiKey && (
                    <button
                      className="link"
                      type="button"
                      onClick={() => handleCopy(activeApiKey.id, "API key ID")}
                    >
                      Copiar ID
                    </button>
                  )}
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
                Al confirmar, se creará la suscripción.
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn primary"
                onClick={() => {
                  setSubscriptionReviewOpen(false);
                  void handleSaveSubscription();
                }}
                disabled={!canReviewSubscription}
              >
                Confirmar suscripción
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
