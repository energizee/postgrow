import { Sprout } from "lucide-react";
import "./Logo.css";

const ICON_SIZE = 24;

export function Logo() {
  return (
    <span className="logo">
      <Sprout size={ICON_SIZE} className="logo__mark" aria-hidden="true" />
      <span className="logo__word">PostGrow</span>
    </span>
  );
}
