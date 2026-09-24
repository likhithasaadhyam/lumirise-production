import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Cog,
  ShieldCheck,
  Package,
  Send,
  Warehouse,
  Users,
  Calendar,
  Clock,
  Briefcase,
  DollarSign,
  Building,
  Target,
  ShoppingCart,
  FileText,
  BarChart3,
  Settings,
  ShieldAlert,
  ChevronDown,
  Layers,
  Sparkles,
  Boxes,
  Key,
  CheckSquare,
  FileSpreadsheet,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getVisibleNavigation, NavSectionConfig } from '../../config/navigation';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-4 h-4" />,
  Cog: <Cog className="w-4 h-4" />,
  ShieldCheck: <ShieldCheck className="w-4 h-4" />,
  Package: <Package className="w-4 h-4" />,
  Send: <Send className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
  Warehouse: <Warehouse className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
  Boxes: <Boxes className="w-4 h-4" />,
  Building: <Building className="w-4 h-4" />,
  Users: <Users className="w-4 h-4" />,
  Clock: <Clock className="w-4 h-4" />,
  Calendar: <Calendar className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  DollarSign: <DollarSign className="w-4 h-4" />,
  Target: <Target className="w-4 h-4" />,
  ShoppingCart: <ShoppingCart className="w-4 h-4" />,
  BarChart3: <BarChart3 className="w-4 h-4" />,
  ShieldAlert: <ShieldAlert className="w-4 h-4" />,
  Key: <Key className="w-4 h-4" />,
  Settings: <Settings className="w-4 h-4" />,
  CheckSquare: <CheckSquare className="w-4 h-4" />,
  FileSpreadsheet: <FileSpreadsheet className="w-4 h-4" />,
  UserCheck: <UserCheck className="w-4 h-4" />,
};

export function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();

  // Collapsible groups state
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const currentRole = user?.roleName || '';
  const visibleSections = getVisibleNavigation(user?.permissions || [], currentRole);

  // Separate workspace (dashboard) from other groups
  const workspaceSection = visibleSections.find((s) => s.id === 'workspace');
  const otherSections = visibleSections.filter((s) => s.id !== 'workspace');

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:flex-shrink-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">LUMIRISE</span>
              <span className="block text-[10px] uppercase font-semibold text-brand-400 tracking-wider">
                Enterprise ERP
              </span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Dashboard / Workspace Link */}
          {workspaceSection?.items.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <div key={item.id}>
                <NavLink
                  to={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="shrink-0">{ICON_MAP[item.iconName] || <LayoutDashboard className="w-4 h-4" />}</span>
                  <span>{item.label}</span>
                </NavLink>
              </div>
            );
          })}

          {/* Role-Filtered Grouped Links */}
          {otherSections.map((group) => {
            const isCollapsed = collapsedGroups[group.id];
            return (
              <div key={group.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-300 uppercase tracking-wider select-none"
                >
                  <span>{group.title}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      isCollapsed ? '-rotate-90 text-slate-500' : 'text-slate-400'
                    }`}
                  />
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 mt-1">
                    {group.items.map((item) => {
                      const isActive =
                        item.href === '/'
                          ? location.pathname === '/'
                          : location.pathname.startsWith(item.href);
                      return (
                        <NavLink
                          key={item.id}
                          to={item.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-slate-800 text-white font-semibold shadow-inner'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={isActive ? 'text-brand-400' : 'text-slate-400'}>
                              {ICON_MAP[item.iconName] || <FileText className="w-4 h-4" />}
                            </span>
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-brand-500/20 text-brand-300 font-semibold">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Current Role Badge */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/30">
          <div className="p-2.5 rounded-lg bg-slate-850 border border-slate-700/60 flex items-center justify-between">
            <div className="truncate">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Account Role</p>
              <p className="text-xs font-semibold text-brand-300 truncate">
                {currentRole.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-mono">
                {user?.permissions?.length || 0} perms
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
