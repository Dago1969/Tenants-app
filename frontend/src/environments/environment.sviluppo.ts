const runtimeDashboardUrl = (window as any).__env?.dashboardUrl || 'http://localhost:4200/dashboard';
const runtimeDashboardBaseUrl = runtimeDashboardUrl.replace(/\/dashboard\/?$/, '');

export const environment = {
  apiBaseUrl: '/api/tenants',
  ticketApiBaseUrl: '/api/ticket',
  dashboardUrl: runtimeDashboardUrl,
  dashboardLoginUrl: runtimeDashboardBaseUrl + '/login',
  dashboardBaseUrl: runtimeDashboardBaseUrl
};