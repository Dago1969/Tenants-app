const runtimeDashboardUrl = (window as any).__env?.dashboardUrl || 'https://dashboard.qtmdev.quicare.com/dashboard';
const runtimeApiBaseUrl = (window as any).__env?.apiBaseUrl || 'https://tenants.qtmdev.quicare.com/api/tenants';
const runtimeDashboardBaseUrl = runtimeDashboardUrl.replace(/\/dashboard\/?$/, '');

export const environment = {
  apiBaseUrl: runtimeApiBaseUrl,
  ticketApiBaseUrl: '/api/ticket',
  dashboardUrl: runtimeDashboardUrl,
  dashboardLoginUrl: runtimeDashboardBaseUrl + '/login',
  dashboardBaseUrl: runtimeDashboardBaseUrl,
  production: true
};
