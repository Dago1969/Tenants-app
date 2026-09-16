const runtimeDashboardUrl = (window as any).__env?.dashboardUrl || 'https://dashboard.qtmdev.quicare.com/dashboard';
const runtimeDashboardBaseUrl = runtimeDashboardUrl.replace(/\/dashboard\/?$/, '');

export const environment = {
  apiBaseUrl: '/api/tenants',
  ticketApiBaseUrl: '/api/ticket',
  dashboardUrl: runtimeDashboardUrl,
  dashboardLoginUrl: runtimeDashboardBaseUrl + '/login',
  dashboardBaseUrl: runtimeDashboardBaseUrl
};