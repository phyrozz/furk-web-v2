import type { ReactNode } from 'react';

interface DashboardStatProps {
  title: string;
  value?: string | number;
  icon: ReactNode;
  iconClassName?: string;
  description?: ReactNode;
}

const DashboardStat = ({ title, value, icon, iconClassName = 'bg-primary-50 text-primary-700', description }: DashboardStatProps) => (
  <div className="furk-stat-card">
    <div className="mb-5 flex items-start justify-between gap-3">
      <p className="pt-2 text-sm font-semibold text-gray-600">{title}</p>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`} aria-hidden="true">{icon}</span>
    </div>
    <p className="break-words text-3xl font-extrabold tracking-tight text-gray-900 tabular-nums">{value ?? '—'}</p>
    {description && <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>}
  </div>
);

export default DashboardStat;
