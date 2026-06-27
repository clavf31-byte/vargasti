import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, subtitle, action, icon }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-8 pb-6 border-b border-border">
      <div className="flex items-start gap-5">
        {icon && <div className="text-3xl opacity-70 mt-1">{icon}</div>}
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
