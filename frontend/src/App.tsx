import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import { ToastProvider } from "./toast";
import { DashboardProvider } from "./dashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { DashboardLayout } from "./layouts/DashboardLayout";

import { OverviewPage } from "./pages/OverviewPage";
import { LoginPage } from "./pages/LoginPage";
import { TenantsPage } from "./pages/TenantsPage";
import { ProvidersPage } from "./pages/ProvidersPage";
import { PoliciesPage } from "./pages/PoliciesPage";
import { RuntimePage } from "./pages/RuntimePage";
import { UsagePage } from "./pages/UsagePage";
import { AuditPage } from "./pages/AuditPage";
import { PricingPage } from "./pages/PricingPage";
import { WebhooksPage } from "./pages/WebhooksPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ObservabilityPage } from "./pages/ObservabilityPage";
import { DocumentationPage } from "./pages/DocumentationPage";
import { ApiKeysPage } from "./pages/ApiKeysPage";
import { ClientSummaryPage } from "./pages/ClientSummaryPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminSubscriptionsPage } from "./pages/AdminSubscriptionsPage";
import { BillingConfirmPage } from "./pages/BillingConfirmPage";
import { BillingSuccessPage } from "./pages/BillingSuccessPage";
import { ServicesPage } from "./pages/ServicesPage";
import { ServiceEditorPage } from "./pages/ServiceEditorPage";
import { TenantServiceDetailPage } from "./pages/TenantServiceDetailPage";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<LoginPage />} />
            <Route path="/billing/confirm" element={<BillingConfirmPage />} />
            <Route path="/billing/success" element={<BillingSuccessPage />} />
            <Route element={<ProtectedRoute />}>
              <Route
                element={
                  <DashboardProvider>
                    <DashboardLayout />
                  </DashboardProvider>
                }
              >
                <Route index element={<OverviewPage />} />
                <Route path="tenants" element={<TenantsPage />} />
                <Route path="providers" element={<ProvidersPage />} />
                <Route path="policies" element={<PoliciesPage />} />
                <Route path="runtime" element={<RuntimePage />} />
                <Route path="usage" element={<UsagePage />} />
                <Route path="audit" element={<AuditPage />} />
                <Route path="pricing" element={<PricingPage />} />
                <Route path="webhooks" element={<WebhooksPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="api-keys" element={<ApiKeysPage />} />
                <Route
                  path="clients/:tenantId"
                  element={<ClientSummaryPage />}
                />
                <Route
                  path="clients/:tenantId/services/:serviceCode"
                  element={<TenantServiceDetailPage />}
                />
                <Route path="docs" element={<DocumentationPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="observability" element={<ObservabilityPage />} />
                <Route element={<AdminRoute />}>
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="services" element={<ServicesPage />} />
                  <Route path="services/new" element={<ServiceEditorPage />} />
                  <Route
                    path="services/:serviceId"
                    element={<ServiceEditorPage />}
                  />
                  <Route path="admin/users" element={<AdminUsersPage />} />
                  <Route
                    path="admin/subscriptions"
                    element={<AdminSubscriptionsPage />}
                  />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
