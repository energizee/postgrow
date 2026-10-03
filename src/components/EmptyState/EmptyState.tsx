import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import "./EmptyState.css";

const ICON_SIZE = 28;

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
};

export function EmptyState({ icon: Icon, title, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon" aria-hidden="true">
        <Icon size={ICON_SIZE} />
      </span>
      <p className="empty-state__title">{title}</p>
      {children}
    </div>
  );
}
