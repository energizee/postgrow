import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader/PageHeader";
import { Segmented } from "../components/Segmented/Segmented";
import { areaHouseholds, greenScore, rankAreas, rankHouseholds } from "../lib/scoring";
import { plural } from "../lib/text";
import { useMember, useStore } from "../store/context";
import "./LeaderboardsPage.css";

type View = "sectors" | "households";

export function LeaderboardsPage() {
  const { state } = useStore();
  const { area, household } = useMember();
  const [view, setView] = useState<View>("sectors");

  return (
    <div className="page">
      <PageHeader title="Leaderboard" subtitle="Points from the last 30 days" />
      <Segmented
        label="Leaderboard"
        value={view}
        onChange={setView}
        options={[
          { value: "sectors", label: "Sectors" },
          { value: "households", label: area.id },
        ]}
      />

      {view === "sectors" ? (
        <ol className="list leaderboard">
          {rankAreas(state).map(({ area: a, points }, index) => (
            <li key={a.id}>
              <Link to={`/sector/${encodeURIComponent(a.id)}`} className={`row row--link ${a.id === area.id ? "row--mine" : ""}`}>
                <span className="rank numeric">{index + 1}</span>
                <span className="row__main">
                  <span className="row__title">{a.id}</span>
                  <span className="row__meta">
                    {greenScore(state, a).green}% green, {plural(areaHouseholds(state, a.id).length, "household")}
                  </span>
                </span>
                <span className="row__value leaderboard__points">{points}</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="list leaderboard">
          {rankHouseholds(state, area.id).map(({ household: h, points }, index) => (
            <li key={h.id} className={`row ${h.id === household.id ? "row--mine" : ""}`}>
              <span className="rank numeric">{index + 1}</span>
              <span className="row__main row__title">{h.name}</span>
              <span className="row__value leaderboard__points">{points}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
