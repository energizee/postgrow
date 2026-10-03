import { ActionIcon } from "../ActionIcon/ActionIcon";
import { StatusPill } from "../StatusPill/StatusPill";
import { getAction } from "../../data/actions";
import { timeAgo } from "../../lib/dates";
import { contributionPoints } from "../../lib/scoring";
import { useStore } from "../../store/context";
import type { Contribution } from "../../types/types";

type ContributionListProps = {
  contributions: Contribution[];
  limit: number;
  showMember?: boolean;
};

// Newest first
export function ContributionList({ contributions, limit, showMember = false }: ContributionListProps) {
  const { state } = useStore();
  const sorted = [...contributions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, limit);

  return (
    <ul className="list">
      {sorted.map((c) => {
        const action = getAction(c.actionId);
        const member = state.users.find((u) => u.id === c.userId);
        return (
          <li key={c.id} className="row">
            <ActionIcon actionId={action.id} lasting={action.impact === "lasting"} />
            <span className="row__main">
              <span className="row__title">{action.name}</span>
              <span className="row__meta">
                {showMember && member ? `${member.name}, ` : ""}
                {timeAgo(c.createdAt)}
              </span>
            </span>
            {c.proof && <StatusPill status={c.proof.status} />}
            <span className="row__value">+{contributionPoints(state, c)}</span>
          </li>
        );
      })}
    </ul>
  );
}
