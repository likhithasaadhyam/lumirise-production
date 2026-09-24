import { notifyDataChange } from '../utils/dataSync';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('lumirise_token');
  }

  public setToken(token: string) {
    localStorage.setItem('lumirise_token', token);
  }

  public clearToken() {
    localStorage.removeItem('lumirise_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    } catch (error) {
      throw new Error('Unable to reach the Lumirise API. Please check that the backend server is running.');
    }

    if (response.status === 401 && !endpoint.includes('/auth/sign-in') && !endpoint.includes('/auth/sign-up')) {
      // Unauthorized: token might be expired
      this.clearToken();
      window.location.href = '/sign-in';
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // ===================== AUTH =====================
  async signIn(data: any) {
    const res: any = await this.request('/auth/sign-in', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  async signUp(data: any) {
    const res: any = await this.request('/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async switchRole(targetRole: string) {
    const res: any = await this.request('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ targetRole }),
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  async requestPasswordReset(email: string) {
    return this.request<any>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    return this.request<any>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, newPassword }),
    });
  }

  // ===================== MANUFACTURING =====================
  async getProductionPlans() {
    return this.request<any[]>('/manufacturing/plans');
  }

  async createProductionPlan(data: any) {
    return this.request<any>('/manufacturing/plans', { method: 'POST', body: JSON.stringify(data) });
  }

  async getProductionOrders(params?: { status?: string; productId?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.productId) query.append('productId', params.productId);
    return this.request<any[]>(`/manufacturing/orders?${query.toString()}`);
  }

  async getProductionOrder(id: string) {
    return this.request<any>(`/manufacturing/orders/${id}`);
  }

  async createProductionOrder(data: any) {
    const res = await this.request<any>('/manufacturing/orders', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['PRODUCTION_ORDER']);
    return res;
  }

  async updateOrderStatus(id: string, data: { status?: string; completedQuantity?: number; rejectedQuantity?: number }) {
    const res = await this.request<any>(`/manufacturing/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    notifyDataChange(['PRODUCTION_ORDER', 'PRODUCT', 'STOCK_MOVEMENT']);
    return res;
  }

  async getQualityInspections() {
    return this.request<any[]>('/manufacturing/quality');
  }

  async createQualityInspection(data: any) {
    const res = await this.request<any>('/manufacturing/quality', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['QUALITY_INSPECTION', 'PRODUCTION_ORDER']);
    return res;
  }

  async getFinishedGoods() {
    return this.request<any[]>('/manufacturing/finished-goods');
  }

  async getDispatches() {
    return this.request<any[]>('/manufacturing/dispatches');
  }

  async createDispatch(data: any) {
    const res = await this.request<any>('/manufacturing/dispatches', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['DISPATCH', 'STOCK_MOVEMENT']);
    return res;
  }

  // ===================== INVENTORY =====================
  async getRawMaterials() {
    return this.request<any[]>('/inventory/raw-materials');
  }

  async createRawMaterial(data: any) {
    const res = await this.request<any>('/inventory/raw-materials', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['RAW_MATERIAL', 'STOCK_MOVEMENT']);
    return res;
  }

  async getProducts() {
    return this.request<any[]>('/inventory/products');
  }

  async createProduct(data: any) {
    const res = await this.request<any>('/inventory/products', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['PRODUCT', 'STOCK_MOVEMENT']);
    return res;
  }

  async getWarehouses() {
    return this.request<any[]>('/inventory/warehouses');
  }

  async createWarehouse(data: any) {
    const res = await this.request<any>('/inventory/warehouses', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['WAREHOUSE', 'STOCK_MOVEMENT']);
    return res;
  }

  async getSuppliers() {
    return this.request<any[]>('/inventory/suppliers');
  }

  async createSupplier(data: any) {
    const res = await this.request<any>('/inventory/suppliers', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['SUPPLIER', 'RAW_MATERIAL']);
    return res;
  }

  async getStockLedger() {
    return this.request<any[]>('/inventory/ledger');
  }

  async recordStockTransaction(data: any) {
    const res = await this.request<any>('/inventory/transaction', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['STOCK_MOVEMENT', 'RAW_MATERIAL', 'PRODUCT']);
    return res;
  }

  async getBatches() {
    return this.request<any[]>('/inventory/batches');
  }

  // ===================== CRM =====================
  async getCustomers() {
    return this.request<any[]>('/crm/customers');
  }

  async createCustomer(data: any) {
    const res = await this.request<any>('/crm/customers', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['CUSTOMER']);
    return res;
  }

  async getLeads() {
    return this.request<any[]>('/crm/leads');
  }

  async createLead(data: any) {
    const res = await this.request<any>('/crm/leads', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['LEAD', 'CUSTOMER']);
    return res;
  }

  async updateLeadStage(id: string, stage: string) {
    const res = await this.request<any>(`/crm/leads/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ status: stage }),
    });
    notifyDataChange(['LEAD', 'CUSTOMER']);
    return res;
  }

  async getSalesOrders() {
    return this.request<any[]>('/crm/orders');
  }

  async createSalesOrder(data: any) {
    const res = await this.request<any>('/crm/orders', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['SALES_ORDER', 'PRODUCT', 'STOCK_MOVEMENT']);
    return res;
  }

  async getInvoices() {
    return this.request<any[]>('/crm/invoices');
  }

  async createInvoice(data: any) {
    const res = await this.request<any>('/crm/invoices', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['INVOICE', 'SALES_ORDER']);
    return res;
  }

  async recordPayment(data: any) {
    const res = await this.request<any>('/crm/payments', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['PAYMENT', 'INVOICE', 'SALES_ORDER']);
    return res;
  }

  // ===================== HRMS =====================
  async getDepartments() {
    return this.request<any[]>('/hrms/departments');
  }

  async createDepartment(data: any) {
    const res = await this.request<any>('/hrms/departments', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['EMPLOYEE']);
    return res;
  }

  async getShifts() {
    return this.request<any[]>('/hrms/shifts');
  }

  async getEmployees(params?: { departmentId?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.departmentId) query.append('departmentId', params.departmentId);
    if (params?.status) query.append('status', params.status);
    return this.request<any[]>(`/hrms/employees?${query.toString()}`);
  }

  async getEmployee(id: string) {
    return this.request<any>(`/hrms/employees/${id}`);
  }

  async createEmployee(data: any) {
    const res = await this.request<any>('/hrms/employees', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['EMPLOYEE']);
    return res;
  }

  async updateEmployee(id: string, data: any) {
    const res = await this.request<any>(`/hrms/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    notifyDataChange(['EMPLOYEE']);
    return res;
  }

  async enableEmployeeLogin(id: string, data: { loginEmail?: string; roleId?: string; password?: string }) {
    const res = await this.request<any>(`/hrms/employees/${id}/enable-login`, { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['EMPLOYEE']);
    return res;
  }

  async disableEmployeeLogin(id: string) {
    const res = await this.request<any>(`/hrms/employees/${id}/disable-login`, { method: 'POST' });
    notifyDataChange(['EMPLOYEE']);
    return res;
  }

  async resetEmployeePassword(id: string, newPassword: string) {
    return this.request<any>(`/hrms/employees/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  async getAttendance(date?: string) {
    return this.request<any[]>(`/hrms/attendance?date=${date || ''}`);
  }

  async punchAttendance(data: { employeeId?: string; type: 'CHECK_IN' | 'CHECK_OUT' }) {
    const res = await this.request<any>('/hrms/attendance/punch', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['ATTENDANCE']);
    return res;
  }

  async getLeaves() {
    return this.request<any[]>('/hrms/leaves');
  }

  async createLeave(data: any) {
    const res = await this.request<any>('/hrms/leaves', { method: 'POST', body: JSON.stringify(data) });
    notifyDataChange(['LEAVE']);
    return res;
  }

  async updateLeaveStatus(id: string, status: 'APPROVED' | 'REJECTED', comments?: string) {
    const res = await this.request<any>(`/hrms/leaves/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comments }),
    });
    notifyDataChange(['LEAVE']);
    return res;
  }

  async getRecruitment() {
    return this.request<any[]>('/hrms/recruitment');
  }

  async createJobOpening(data: any) {
    return this.request<any>('/hrms/recruitment/openings', { method: 'POST', body: JSON.stringify(data) });
  }

  async updateCandidateStage(id: string, stage: string) {
    return this.request<any>(`/hrms/recruitment/candidates/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    });
  }

  async getPayroll() {
    return this.request<any[]>('/hrms/payroll');
  }

  // ===================== REPORTS & DASHBOARD =====================
  async getDashboardKPIs() {
    return this.request<any>('/reports/dashboard-kpis');
  }

  async getProductionSummary() {
    return this.request<any>('/reports/production-summary');
  }

  async getInventoryValuation() {
    return this.request<any>('/reports/inventory-valuation');
  }

  // ===================== SEARCH & NOTIFICATIONS =====================
  async search(query: string) {
    return this.request<any>(`/search?q=${encodeURIComponent(query)}`);
  }

  async getNotifications() {
    return this.request<any[]>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<any>(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead() {
    return this.request<any>('/notifications/mark-all-read', { method: 'POST' });
  }

  // ===================== ORGANIZATION & AUDIT =====================
  async getOrgSettings() {
    return this.request<any>('/organization/settings');
  }

  async updateOrgSettings(data: any) {
    return this.request<any>('/organization/settings', { method: 'PATCH', body: JSON.stringify(data) });
  }

  async getUsers() {
    return this.request<any[]>('/organization/users');
  }

  async getAuditLogs() {
    return this.request<any[]>('/audit');
  }

  async getRoles() {
    return this.request<any[]>('/organization/roles');
  }

  async updateRolePermissions(roleId: string, permissions: string[]) {
    return this.request<any>(`/organization/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  }

  async get(endpoint: string) {
    return this.request<any>(endpoint);
  }

  async put(endpoint: string, body: any) {
    return this.request<any>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }
}

export const api = new ApiClient();
export default api;

