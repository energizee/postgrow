import { CircleCheck, CircleX, Clock } from "lucide-react";
import type { Proof } from "../../types/types";
import "./StatusPill.css";

const ICON_SIZE = 14;
const STATUS = {
  pending: { label: "In review", Icon: Clock },
  approved: { label: "Approved", Icon: CircleCheck },
  rejected: { label: "Not approved", Icon: CircleX },
};

export function StatusPill({ status }: { status: Proof["status"] }) {
  const { label, Icon } = STATUS[status];
  return (
    <span className={`status-pill status-pill--${status}`}>
      <Icon size={ICON_SIZE} aria-hidden="true" />
      {label}
    </span>
  );
}
