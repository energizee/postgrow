import { useState } from "react";
import { CalendarPlus, Megaphone, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState/EmptyState";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { Segmented } from "../../components/Segmented/Segmented";
import { formatDayOfMonth, formatShortMonth } from "../../lib/dates";
import { useMember, useStore } from "../../store/context";
import "./Bulletin.css";

type View = "upcoming" | "past";
const ICON_SIZE = 16;

export function BulletinPage() {
  const { state } = useStore();
  const { user, area } = useMember();
  const [view, setView] = useState<View>("upcoming");
  const [now] = useState(Date.now);

  const activities = state.activities
    .filter((a) => a.postcodeAreaId === area.id)
    .filter((a) => (view === "upcoming" ? Date.parse(a.date) >= now : Date.parse(a.date) < now))
    .sort((a, b) => (view === "upcoming" ? 1 : -1) * (Date.parse(a.date) - Date.parse(b.date)));

  return (
    <div className="page">
      <PageHeader
        title="Bulletin"
        subtitle={area.id}
        actions={
          <Link to="/bulletin/new" className="btn btn--primary">
            <CalendarPlus size={ICON_SIZE + 2} aria-hidden="true" />
            Post
          </Link>
        }
      />
      <Segmented
        label="When"
        value={view}
        onChange={setView}
        options={[
          { value: "upcoming", label: "Upcoming" },
          { value: "past", label: "Past" },
        ]}
      />

      {activities.length === 0 ? (
        <EmptyState icon={Megaphone} title={view === "upcoming" ? "Nothing planned yet" : "No past activities"}>
          {view === "upcoming" && (
            <Link to="/bulletin/new" className="btn btn--secondary">
              Post an activity
            </Link>
          )}
        </EmptyState>
      ) : (
        <ul className="list">
          {activities.map((a) => (
            <li key={a.id}>
              <Link to={`/bulletin/${a.id}`} className="row row--link">
                <span className="date-tile" aria-hidden="true">
                  <span className="date-tile__day">{formatDayOfMonth(a.date)}</span>
                  <span className="date-tile__month">{formatShortMonth(a.date)}</span>
                </span>
                <span className="row__main">
                  <span className="row__title">{a.title}</span>
                  <span className="row__meta">{a.place}</span>
                </span>
                <span className={`participants ${a.participantIds.includes(user.id) ? "participants--joined" : ""}`}>
                  <Users size={ICON_SIZE} aria-label="Going" />
                  {a.participantIds.length}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
