import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { useDataSync, SyncEntity } from '../../utils/dataSync';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  Cog,
  Users,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Package,
  CheckSquare,
  ShieldCheck,
  Building,
  DollarSign,
  ShoppingCart,
  FileText,
  Warehouse,
  Calendar,
  Send,
  Play,
  Pause,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

export function DashboardPage() {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  const [kpis, setKpis] = useState<any>(null);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [recentLedger, setRecentLedger] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Employee shift state
  const [isClockedIn, setIsClockedIn] = useState(true);

  // Setup checklist state for Admin
  const [setupDismissed, setSetupDismissed] = useState(false);

  const role = user?.roleName || 'ADMIN';
  const perms = new Set(user?.permissions || []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch only data permissible for active role to avoid 403 errors
      const promises: Promise<any>[] = [];

      if (role === 'ADMIN' || perms.has('dashboard.view')) {
        promises.push(api.getDashboardKPIs().catch(() => null));
      } else {
        promises.push(Promise.resolve(null));
      }

      if (role === 'ADMIN' || perms.has('production.view')) {
        promises.push(api.getProductionOrders({ status: 'IN_PROGRESS' }).catch(() => []));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (role === 'ADMIN' || perms.has('stock.view')) {
        promises.push(api.getStockLedger().catch(() => []));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (role === 'ADMIN' || perms.has('leave.manage') || perms.has('employees.manage')) {
        promises.push(api.getLeaves().catch(() => []));
      } else {
        promises.push(Promise.resolve([]));
      }

      if (role === 'ADMIN' || perms.has('invoices.view')) {
        promises.push(api.getInvoices().catch(() => []));
      } else {
        promises.push(Promise.resolve([]));
      }

      const [kpiData, orders, ledger, leaves, invoiceList] = await Promise.all(promises);

      setKpis(kpiData);
      setProductionOrders((orders || []).slice(0, 5));
      setRecentLedger((ledger || []).slice(0, 5));
      setPendingLeaves((leaves || []).filter((l: any) => l.status === 'PENDING').slice(0, 4));
      setInvoices((invoiceList || []).slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [role]);

  // Reactive Cross-Dashboard Invalidation: automatically refetch authoritative data when relevant entities mutate
  const roleSyncEntities: SyncEntity[] =
    role === 'PRODUCTION_MANAGER'
      ? ['PRODUCTION_ORDER', 'QUALITY_INSPECTION', 'RAW_MATERIAL', 'PRODUCT', 'STOCK_MOVEMENT']
      : role === 'WAREHOUSE_MANAGER'
      ? ['STOCK_MOVEMENT', 'RAW_MATERIAL', 'PRODUCT', 'DISPATCH']
      : role === 'HR_MANAGER'
      ? ['EMPLOYEE', 'ATTENDANCE', 'LEAVE', 'PAYROLL']
      : role === 'ACCOUNTANT'
      ? ['SALES_ORDER', 'INVOICE', 'PAYROLL']
      : ['PRODUCTION_ORDER', 'QUALITY_INSPECTION', 'RAW_MATERIAL', 'PRODUCT', 'STOCK_MOVEMENT', 'EMPLOYEE', 'ATTENDANCE', 'LEAVE', 'PAYROLL', 'SALES_ORDER', 'INVOICE', 'DISPATCH'];

  useDataSync(roleSyncEntities, loadDashboardData);

  // Role Header Action Buttons
  const renderHeaderActions = () => {
    switch (role) {
      case 'PRODUCTION_MANAGER':
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/operations/quality')}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-amber-600" />}
            >
              QA Queue
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/operations/production?action=new')}
              leftIcon={<Cog className="w-3.5 h-3.5" />}
            >
              New Work Order
            </Button>
          </div>
        );
      case 'WAREHOUSE_MANAGER':
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/operations/dispatch?action=new')}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Create Dispatch
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/inventory/stock-in-out')}
              leftIcon={<Package className="w-3.5 h-3.5" />}
            >
              Stock In / Out
            </Button>
          </div>
        );
      case 'HR_MANAGER':
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/people/leave')}
              leftIcon={<Calendar className="w-3.5 h-3.5 text-indigo-600" />}
            >
              Leave Approvals
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/people/employees?action=new')}
              leftIcon={<Users className="w-3.5 h-3.5" />}
            >
              Onboard Employee
            </Button>
          </div>
        );
      case 'ACCOUNTANT':
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/business/orders')}
              leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
            >
              Sales Orders
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/business/invoices?action=new')}
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              Create Invoice
            </Button>
          </div>
        );
      case 'PRODUCTION_EMPLOYEE':
      case 'WAREHOUSE_EMPLOYEE':
      case 'EMPLOYEE':
        return (
          <div className="flex items-center gap-2">
            <Button
              variant={isClockedIn ? 'outline' : 'primary'}
              size="sm"
              onClick={() => setIsClockedIn(!isClockedIn)}
              leftIcon={isClockedIn ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5" />}
            >
              {isClockedIn ? 'Clock Out / Break' : 'Clock In Now'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/people/leave?action=new')}
              leftIcon={<Calendar className="w-3.5 h-3.5" />}
            >
              Request Leave
            </Button>
          </div>
        );
      default: // ADMIN
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/operations/production?action=new')}
              leftIcon={<Cog className="w-3.5 h-3.5" />}
            >
              New Work Order
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/inventory/stock-in-out')}
              leftIcon={<Package className="w-3.5 h-3.5" />}
            >
              Stock In / Out
            </Button>
          </div>
        );
    }
  };

  // ==========================================
  // 1. PRODUCTION MANAGER VIEW
  // ==========================================
  if (role === 'PRODUCTION_MANAGER') {
    return (
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Shopfloor Operations Command
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-200">
                PRODUCTION MANAGER
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active lines: Milling Cell 1-4, CNC Lathes, Heat Treatment • Overall Yield Target: 98.5%
            </p>
          </div>
          {renderHeaderActions()}
        </div>

        {/* Production Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Active Work Orders"
            value={kpis?.activeOrders ?? 0}
            subtitle="Scheduled in facility"
            trend={{ value: `${kpis?.activeOrders ?? 0} active`, isPositive: true }}
            icon={<Cog className="w-5 h-5 text-brand-600" />}
          />
          <StatCard
            title="Shopfloor Yield"
            value={kpis?.overallYield ?? '98.5%'}
            subtitle="First-pass production quality"
            trend={{ value: kpis?.overallYield ?? '98.5%', isPositive: true }}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          />
          <StatCard
            title="Quality Hold Items"
            value={kpis?.qualityHolds ?? 0}
            subtitle="Requires QA signoff"
            trend={{ value: `${kpis?.qualityHolds ?? 0} pending`, isPositive: (kpis?.qualityHolds ?? 0) === 0 }}
            icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          />
          <StatCard
            title="Low Stock Raw Materials"
            value={kpis?.lowStockMaterials ?? 0}
            subtitle="Under safety minimum stock"
            trend={{ value: `${kpis?.lowStockMaterials ?? 0} alerts`, isPositive: (kpis?.lowStockMaterials ?? 0) === 0 }}
            icon={<Package className="w-5 h-5 text-rose-600" />}
          />
        </div>

        {/* Live Work Orders Table */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Current Production Orders</h2>
              <p className="text-xs text-slate-500">Live shopfloor tracking across production cells</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/operations/production')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              All Orders
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Order Number</th>
                  <th className="px-4 py-3">Part Description</th>
                  <th className="px-4 py-3">Progress (Completed / Target)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {productionOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-brand-600">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-semibold">
                      {order.product?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-700">
                          {order.completedQuantity} / {order.targetQuantity}
                        </span>
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-600 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((order.completedQuantity / order.targetQuantity) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">{order.endDate || '2026-09-30'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // ==========================================
  // 2. WAREHOUSE MANAGER VIEW
  // ==========================================
  if (role === 'WAREHOUSE_MANAGER') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Logistics & Depot Operations
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                WAREHOUSE MANAGER
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Main Facility: 3 Active Depots • Bulk Receiving • Cold Storage • Finished Dispatch Bay
            </p>
          </div>
          {renderHeaderActions()}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Stock Value"
            value={kpis?.totalStockValue ? `$${Number(kpis.totalStockValue).toLocaleString()}` : '$0'}
            subtitle="Raw materials + Finished goods"
            trend={{ value: "Live valuation", isPositive: true }}
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          />
          <StatCard
            title="Safety Stock Alerts"
            value={kpis?.lowStockMaterials ?? 0}
            subtitle="Items under minimum"
            trend={{ value: `${kpis?.lowStockMaterials ?? 0} items`, isPositive: (kpis?.lowStockMaterials ?? 0) === 0 }}
            icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          />
          <StatCard
            title="Depot Capacity"
            value={kpis?.warehouseDepotCapacity ?? '76.4%'}
            subtitle="Across active warehouses"
            trend={{ value: "Optimal", isPositive: true }}
            icon={<Warehouse className="w-5 h-5 text-brand-600" />}
          />
          <StatCard
            title="Pending Dispatches"
            value={`${kpis?.pendingDispatches ?? 0} Shipments`}
            subtitle="Scheduled in depot"
            trend={{ value: "On time", isPositive: true }}
            icon={<Send className="w-5 h-5 text-sky-600" />}
          />
        </div>

        {/* Recent Stock Movements */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Inventory Movements</h2>
              <p className="text-xs text-slate-500">Live stock ledger activity and transfer audit</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/inventory/ledger')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Full Ledger
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Item / Material</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Depot</th>
                  <th className="px-4 py-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentLedger.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-semibold">
                      {entry.rawMaterial?.name || entry.product?.name || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          entry.type === 'IN'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      {entry.type === 'IN' ? `+${entry.quantity}` : `-${entry.quantity}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.warehouse?.name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{entry.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // ==========================================
  // 3. HR MANAGER VIEW
  // ==========================================
  if (role === 'HR_MANAGER') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Workforce & People Center
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                HR MANAGER
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Active Headcount: {kpis?.totalEmployees || 12} • 3 Shifts Active • Next Payroll: End of Month
            </p>
          </div>
          {renderHeaderActions()}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Headcount"
            value={kpis?.totalEmployees ?? 0}
            subtitle="Registered workforce"
            trend={{ value: "Active", isPositive: true }}
            icon={<Users className="w-5 h-5 text-indigo-600" />}
          />
          <StatCard
            title="Present on Shift Today"
            value={kpis?.presentToday ?? 0}
            subtitle="Logged attendance"
            trend={{ value: "On Shift", isPositive: true }}
            icon={<Clock className="w-5 h-5 text-emerald-600" />}
          />
          <StatCard
            title="Pending PTO Approvals"
            value={kpis?.pendingLeaves ?? 0}
            subtitle="Awaiting supervisor signoff"
            trend={{ value: `${kpis?.pendingLeaves ?? 0} pending`, isPositive: (kpis?.pendingLeaves ?? 0) === 0 }}
            icon={<Calendar className="w-5 h-5 text-amber-600" />}
          />
          <StatCard
            title="Open Requisitions"
            value={`${kpis?.openRequisitions ?? 0} Positions`}
            subtitle="Active career postings"
            trend={{ value: "Hiring", isPositive: true }}
            icon={<Building className="w-5 h-5 text-brand-600" />}
          />
        </div>

        {/* Pending Leaves Queue */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pending Leave Applications</h2>
              <p className="text-xs text-slate-500">Employee time-off requests requiring HR or Manager approval</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/people/leave')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Leave Management
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {pendingLeaves.map((req) => (
              <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {req.employee?.firstName?.[0] || 'E'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {req.employee?.firstName} {req.employee?.lastName}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {req.leaveType?.name || 'Vacation'} • {req.startDate} to {req.endDate} ({req.days} days)
                    </p>
                    <p className="text-[11px] text-slate-600 italic mt-0.5">"{req.reason}"</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/people/leave')}
                  >
                    Review Application
                  </Button>
                </div>
              </div>
            ))}

            {pendingLeaves.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">
                All leave requests have been addressed. No pending approvals in queue.
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ==========================================
  // 4. ACCOUNTANT VIEW
  // ==========================================
  if (role === 'ACCOUNTANT') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Billing & Accounts Receivable Command
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                FINANCIAL ACCOUNTANT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Fiscal Year 2026 • Commercial Ledger & Tax Compliance Overview
            </p>
          </div>
          {renderHeaderActions()}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue Collected"
            value={`$${(kpis?.totalRevenue || 0).toLocaleString()}`}
            subtitle="Cleared payments"
            trend={{ value: "Settled", isPositive: true }}
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          />
          <StatCard
            title="Accounts Receivable"
            value={`$${(kpis?.receivablesPending || 0).toLocaleString()}`}
            subtitle="Pending customer payment"
            trend={{ value: "Pending", isPositive: false }}
            icon={<FileText className="w-5 h-5 text-cyan-600" />}
          />
          <StatCard
            title="Open Sales Orders"
            value={`$${(kpis?.openSalesOrdersValue || 0).toLocaleString()}`}
            subtitle="In fulfillment pipeline"
            trend={{ value: "Pipeline", isPositive: true }}
            icon={<ShoppingCart className="w-5 h-5 text-brand-600" />}
          />
          <StatCard
            title="Next Payroll Run"
            value={`$${(kpis?.nextPayrollRun || 0).toLocaleString()}`}
            subtitle="Monthly base commitments"
            trend={{ value: "Scheduled", isPositive: true }}
            icon={<Users className="w-5 h-5 text-purple-600" />}
          />
        </div>

        {/* Invoices Ledger */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Commercial Invoices</h2>
              <p className="text-xs text-slate-500">Billing stubs, amounts due, and payment status</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/business/invoices')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              All Invoices
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Customer Account</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Paid Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-700">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {inv.customer?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{inv.dueDate}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      ${inv.total.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-600">
                      ${inv.amountPaid.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // ==========================================
  // 5. EMPLOYEE / OPERATOR VIEW (Self-Service)
  // ==========================================
  if (
    role === 'PRODUCTION_EMPLOYEE' ||
    role === 'WAREHOUSE_EMPLOYEE' ||
    role === 'EMPLOYEE'
  ) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Employee Terminal & Self-Service
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {role.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Logged in as {user?.firstName} {user?.lastName} • Cleveland Plant Station Cell
            </p>
          </div>
          {renderHeaderActions()}
        </div>

        {/* Employee Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Shift Status"
            value={kpis?.employeeStats?.isClockedIn ? 'Clocked In' : 'Clocked Out'}
            subtitle={kpis?.employeeStats?.isClockedIn ? 'Active on duty' : 'Ready to start'}
            trend={{ value: kpis?.employeeStats?.isClockedIn ? 'Active' : 'Offline', isPositive: !!kpis?.employeeStats?.isClockedIn }}
            icon={<Clock className="w-5 h-5 text-teal-600" />}
          />
          <StatCard
            title="My Assigned Tasks"
            value={`${kpis?.employeeStats?.myAssignedTasksCount ?? 0} Work Orders`}
            subtitle="Active orders assigned"
            trend={{ value: 'Assigned', isPositive: true }}
            icon={<WrenchIcon className="w-5 h-5 text-brand-600" />}
          />
          <StatCard
            title="Leave Balance"
            value={`${kpis?.employeeStats?.myLeaveBalance ?? 18} Days Available`}
            subtitle="Paid time off (PTO)"
            trend={{ value: `${kpis?.employeeStats?.myLeaveBalance ?? 18} days`, isPositive: true }}
            icon={<Calendar className="w-5 h-5 text-indigo-600" />}
          />
          <StatCard
            title="Latest Pay Slip"
            value={`$${(kpis?.employeeStats?.latestPaySlipAmount || 0).toLocaleString()}`}
            subtitle="Latest net pay"
            trend={{ value: 'Verified', isPositive: true }}
            icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          />
        </div>

        {/* Quick Launch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card
            className="p-5 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-brand-500 group"
            onClick={() => navigate('/portal/tasks')}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                My Work Orders & Stations
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              View instructions, report manufactured piece output, and log machine scrap.
            </p>
          </Card>

          <Card
            className="p-5 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-indigo-500 group"
            onClick={() => navigate('/people/leave')}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                My Time Off & Leaves
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Submit vacation or sick leave requests and track supervisor signoff.
            </p>
          </Card>

          <Card
            className="p-5 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-emerald-500 group"
            onClick={() => navigate('/portal/payslips')}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                My Compensation Slips
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Download tax statements, overtime logs, and proof of earnings stubs.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // ==========================================
  // 6. SUPER ADMIN / EXECUTIVE VIEW (Default)
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Executive Management Overview
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              SUPER ADMIN / EXEC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {organization?.name} • Plant 1 Cleveland • Global Operational Telemetry
          </p>
        </div>
        {renderHeaderActions()}
      </div>

      {/* Admin Setup Checklist */}
      {!setupDismissed && (
        <div className="bg-gradient-to-r from-brand-50 via-sky-50 to-indigo-50 border border-brand-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-brand-600 text-white shadow-2xs">
                <CheckSquare className="w-3.5 h-3.5" />
              </span>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Enterprise Workspace Setup Verification
              </h2>
            </div>
            <button
              onClick={() => setSetupDismissed(true)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 border border-brand-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-800 font-medium">8 Enterprise Personas Seeded</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 border border-brand-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-800 font-medium">Multi-Depot Inventory Online</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 border border-brand-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-800 font-medium">Shopfloor QA Gates Calibrated</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 border border-brand-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-800 font-medium">Granular RBAC Enforced</span>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Production Orders"
          value={kpis?.activeOrders ?? 0}
          subtitle="Shopfloor operations"
          trend={{ value: `${kpis?.activeOrders ?? 0} active`, isPositive: true }}
          icon={<Cog className="w-5 h-5 text-brand-600" />}
        />
        <StatCard
          title="Total Workforce Headcount"
          value={kpis?.totalEmployees ?? 0}
          subtitle={`${kpis?.presentToday ?? 0} present on shift`}
          trend={{ value: "100% active", isPositive: true }}
          icon={<Users className="w-5 h-5 text-indigo-600" />}
        />
        <StatCard
          title="Total Billed Revenue"
          value={`$${(kpis?.totalRevenue || 0).toLocaleString()}`}
          subtitle={`Receivables: $${((kpis?.receivablesPending || 0) / 1000).toFixed(1)}k`}
          trend={{ value: "Billed", isPositive: true }}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          title="Critical Safety Alerts"
          value={(kpis?.lowStockMaterials || 0) + (kpis?.qualityHolds || 0)}
          subtitle={`${kpis?.lowStockMaterials || 0} Low Stock • ${kpis?.qualityHolds || 0} QA Hold`}
          trend={{ value: "Action needed", isPositive: (kpis?.lowStockMaterials || 0) + (kpis?.qualityHolds || 0) === 0 }}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Production & Inventory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Active Production Schedule</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/operations/production')}
            >
              All Orders
            </Button>
          </div>
          <div className="divide-y divide-slate-100">
            {productionOrders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No active production orders.
              </div>
            ) : (
              productionOrders.map((order) => (
                <div key={order.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-brand-600">{order.orderNumber}</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{order.product?.name || '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-slate-700">
                      {order.completedQuantity} / {order.targetQuantity}
                    </span>
                    <div className="mt-1">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Recent Inventory Movements</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/inventory/ledger')}
            >
              All Movements
            </Button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentLedger.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No inventory movements yet.
              </div>
            ) : (
              recentLedger.map((entry) => (
                <div key={entry.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {entry.rawMaterial?.name || entry.product?.name || '—'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">{entry.reference || '—'}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono font-bold ${
                        entry.type === 'IN' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {entry.type === 'IN' ? `+${entry.quantity}` : `-${entry.quantity}`}
                    </span>
                    <p className="text-[10px] text-slate-500">{entry.warehouse?.name || '—'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function WrenchIcon(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
