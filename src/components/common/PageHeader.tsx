import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

const PageHeader = ({ title, description, eyebrow, actions }: PageHeaderProps) => (
  <header className="furk-page-header">
    <div className="min-w-0">
      {eyebrow && <p className="furk-eyebrow">{eyebrow}</p>}
      <h1 className="furk-page-title">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

export default PageHeader;
