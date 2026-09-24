import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="text-center py-8 px-4 max-w-sm mx-auto">
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3">
        {icon || <PackageOpen className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}
