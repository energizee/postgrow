import type { ReactNode } from "react";
import { ChevronLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./PageHeader.css";

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: "back" | "close";
  fallback?: string; // where back goes when there's no history
  actions?: ReactNode;
};

const ICON_SIZE = 22;

export function PageHeader({ title, subtitle, back, fallback = "/", actions }: PageHeaderProps) {
  const navigate = useNavigate();
  const goBack = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback));
  const BackIcon = back === "close" ? X : ChevronLeft;

  return (
    <header className="page-header">
      {back && (
        <button type="button" className="icon-btn page-header__back" onClick={goBack} aria-label={back === "close" ? "Close" : "Back"}>
          <BackIcon size={ICON_SIZE} />
        </button>
      )}
      <div className="page-header__text">
        <h1>{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}
