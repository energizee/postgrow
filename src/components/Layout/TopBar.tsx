import { Flame, Inbox, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { reviewQueue } from "../../lib/reviews";
import { streaks } from "../../lib/scoring";
import { useMember, useStore } from "../../store/context";
import { Avatar } from "../Avatar/Avatar";
import { Logo } from "../Logo/Logo";

const ICON_SIZE = 18;
const AVATAR_SIZE = 34;

export function TopBar() {
  const { state } = useStore();
  const { user, area } = useMember();
  const streak = streaks(state, user.id).current;
  const waiting = reviewQueue(state, area.id).length;

  return (
    <header className="top-bar">
      <Link to="/" className="top-bar__home" aria-label="PostGrow map">
        <Logo />
      </Link>
      <div className="top-bar__tools">
        <Link to={`/sector/${encodeURIComponent(area.id)}`} className="chip top-bar__sector">
          <MapPin size={ICON_SIZE} aria-hidden="true" />
          {area.id}
        </Link>
        <span className="top-bar__streak" aria-label={`${streak} day streak`} title="Streak">
          <Flame size={ICON_SIZE} aria-hidden="true" />
          <span className="numeric">{streak}</span>
        </span>
        <Link to="/reviews" className="icon-btn" aria-label={waiting ? `Reviews, ${waiting} waiting` : "Reviews"}>
          <Inbox size={ICON_SIZE + 2} aria-hidden="true" />
          {waiting > 0 && <span className="top-bar__badge">{waiting}</span>}
        </Link>
        <Link to="/profile" className="icon-btn" aria-label="Profile">
          <Avatar name={user.name} size={AVATAR_SIZE} />
        </Link>
      </div>
    </header>
  );
}
