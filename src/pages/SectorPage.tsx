import { Megaphone } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ActionIcon } from "../components/ActionIcon/ActionIcon";
import { PageHeader } from "../components/PageHeader/PageHeader";
import { CATEGORY_NAMES, getAction } from "../data/actions";
import { timeAgo } from "../lib/dates";
import { categoryPercent } from "../lib/profile";
import { areaHouseholds, contributionPoints, greenScore, rankHouseholds } from "../lib/scoring";
import { plural } from "../lib/text";
import { useMember, useStore } from "../store/context";
import type { ProfileCategory } from "../types/types";
import "./SectorPage.css";

const TOP_HOUSEHOLDS = 5;
const RECENT_COUNT = 8;
const ICON_SIZE = 20;
export function SectorPage() {
  const { sectorId = "" } = useParams();
  const { state } = useStore();
  const { area: ownArea, household: ownHousehold } = useMember();
  const area = state.areas.find((a) => a.id === decodeURIComponent(sectorId));
  if (!area) return <Navigate to="/" replace />;

  const score = greenScore(state, area);
  const households = rankHouseholds(state, area.id).slice(0, TOP_HOUSEHOLDS);
  const recent = state.contributions
    .filter((c) => c.postcodeAreaId === area.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, RECENT_COUNT);
  const categories = (Object.keys(CATEGORY_NAMES) as ProfileCategory[]).flatMap((category) => {
    const percent = area.profile ? categoryPercent(area.profile, category) : null;
    return percent === null ? [] : [{ category, percent }];
  });
  const isOwn = area.id === ownArea.id;

  return (
    <div className="page">
      <PageHeader
        back="back"
        title={area.id}
        subtitle={plural(areaHouseholds(state, area.id).length, "household")}
        actions={
          isOwn && (
            <Link to="/bulletin" className="icon-btn" aria-label="Bulletin board">
              <Megaphone size={ICON_SIZE} />
            </Link>
          )
        }
      />

      <section className="section" aria-labelledby="score-heading">
        <p className="sector-score">
          <span className="sector-score__percent numeric">{score.green}%</span>
          <span id="score-heading" className="muted">
            Green score
          </span>
        </p>
        <dl className="stats">
          <div className="stat">
            <dt>Profile</dt>
            <dd>{score.profile}%</dd>
          </div>
          <div className="stat">
            <dt>Earned</dt>
            <dd>+{score.earned}</dd>
          </div>
          <div className="stat">
            <dt>Momentum</dt>
            <dd>+{score.momentum}</dd>
          </div>
        </dl>
      </section>

      <section className="section" aria-labelledby="profile-heading">
        <h2 id="profile-heading">Profile</h2>
        <ul className="list">
          {categories.map(({ category, percent }) => (
            <li key={category} className="row">
              <span className="row__main">{CATEGORY_NAMES[category]}</span>
              <span className="row__value">{percent}%</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="households-heading">
        <div className="section__head">
          <h2 id="households-heading">Households</h2>
          <span className="muted">Last 30 days</span>
        </div>
        <ol className="list">
          {households.map(({ household, points }, index) => (
            <li key={household.id} className={`row ${household.id === ownHousehold.id ? "row--mine" : ""}`}>
              <span className="rank numeric">{index + 1}</span>
              <span className="row__main row__title">{household.name}</span>
              <span className="row__value">{points}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="section" aria-labelledby="recent-heading">
        <h2 id="recent-heading">Recent</h2>
        {recent.length === 0 ? (
          <p className="muted">Nothing logged yet</p>
        ) : (
          <ul className="list">
            {recent.map((c) => {
              const action = getAction(c.actionId);
              const household = state.households.find((h) => h.id === c.householdId);
              return (
                <li key={c.id} className="row">
                  <ActionIcon actionId={action.id} lasting={action.impact === "lasting"} />
                  <span className="row__main">
                    <span className="row__title">{action.name}</span>
                    <span className="row__meta">
                      {household?.name}, {timeAgo(c.createdAt)}
                    </span>
                  </span>
                  <span className="row__value">+{contributionPoints(state, c)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
