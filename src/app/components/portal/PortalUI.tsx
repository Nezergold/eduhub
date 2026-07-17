import type { ReactNode } from "react";

/** Shared portal design tokens — use across student, lecturer, and registrar views. */
export const portalInputClass =
  "w-full bg-input-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all min-h-[44px]";

export const portalSelectClass =
  "w-full bg-input-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all min-h-[44px]";

export function PortalCard({
  children,
  className = "",
  compact = false,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`portal-card bg-card rounded-xl border border-border shadow-sm ${
        compact ? "p-4" : "p-4 sm:p-5"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 sm:mb-6">
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl font-bold text-foreground font-[Outfit]">{title}</h2>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function StatGrid({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const colClass =
    cols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : cols === 3
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-2 lg:grid-cols-4";
  return <div className={`grid ${colClass} gap-3 sm:gap-4`}>{children}</div>;
}

/** Responsive table shell: horizontal scroll on small screens, full width on desktop. */
export function DataTableShell({
  children,
  minWidth = 640,
  className = "",
}: {
  children: ReactNode;
  minWidth?: number;
  className?: string;
}) {
  return (
    <div className={`portal-table-wrap overflow-x-auto -mx-4 sm:mx-0 ${className}`}>
      <div style={{ minWidth }} className="px-4 sm:px-0">
        {children}
      </div>
    </div>
  );
}

export function PortalButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md";
}) {
  const variants = {
    primary: "bg-accent text-white hover:bg-accent/90 border border-transparent",
    outline: "border border-accent/30 text-accent hover:bg-accent/5 bg-card",
    ghost: "border border-border text-foreground hover:bg-muted/50 bg-card",
    danger: "border border-red-200 text-red-700 bg-red-50 hover:bg-red-100",
  };
  const sizes = {
    sm: "text-xs px-2.5 py-1.5 rounded-lg min-h-[36px]",
    md: "text-sm px-4 py-2.5 rounded-xl min-h-[44px]",
  };
  return (
    <button
      type="button"
      className={`portal-btn inline-flex items-center justify-center gap-1.5 font-semibold transition-colors disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <PortalCard className="text-center py-8 sm:py-10">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>}
    </PortalCard>
  );
}
