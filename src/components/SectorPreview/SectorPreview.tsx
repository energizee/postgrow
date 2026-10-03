import { useId, useState } from "react";
import { Share2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { areaHouseholds, areaRecentPoints, greenScore } from "../../lib/scoring";
import { useStore } from "../../store/context";
import type { AreaProfile, LatLng, PostcodeArea } from "../../types/types";
import "./SectorPreview.css";

const ICON_SIZE = 20;

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const headingId = useId();
  return (
    <aside className="sheet" aria-labelledby={headingId}>
      <header className="sheet__head">
        <h2 id={headingId} className="sheet__title">
          {title}
        </h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          <X size={ICON_SIZE} />
        </button>
      </header>
      {children}
    </aside>
  );
}

export function SectorPreview({ area, onClose }: { area: PostcodeArea; onClose: () => void }) {
  const { state } = useStore();
  const score = greenScore(state, area);

  return (
    <Sheet title={area.id} onClose={onClose}>
      <div className="preview__facts">
        <p className="preview__score">
          <span className="preview__percent numeric">{score.green}%</span>
          <span className="muted">green score</span>
        </p>
        <dl className="stats">
          <div className="stat">
            <dt>Points, 30 days</dt>
            <dd>{areaRecentPoints(state, area.id)}</dd>
          </div>
          <div className="stat">
            <dt>Households</dt>
            <dd>{areaHouseholds(state, area.id).length}</dd>
          </div>
        </dl>
      </div>
      <Link to={`/sector/${encodeURIComponent(area.id)}`} className="btn btn--primary btn--block">
        View sector
      </Link>
    </Sheet>
  );
}

export type UnjoinedSector = { id: string; location: LatLng; profile: AreaProfile | null };

export function UnjoinedPreview({ sector, onClose }: { sector: UnjoinedSector; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const profile = sector.profile?.percentage ?? 0;

  async function invite() {
    const url = window.location.origin;
    const text = `Help grow ${sector.id} on PostGrow`;
    if (navigator.share) {
      await navigator.share({ title: "PostGrow", text, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(`${text}: ${url}`);
    setCopied(true);
  }

  return (
    <Sheet title={sector.id} onClose={onClose}>
      <div className="preview__facts">
        <p className="muted">No households yet</p>
        {sector.profile ? (
          <p className="preview__score">
            <span className="preview__percent numeric">{profile}%</span>
            <span className="muted">profile</span>
          </p>
        ) : (
          <p className="muted" aria-live="polite">
            Loading local data
          </p>
        )}
      </div>
      <button type="button" className="btn btn--secondary btn--block" onClick={invite}>
        <Share2 size={ICON_SIZE} aria-hidden="true" />
        {copied ? "Link copied" : "Invite neighbours"}
      </button>
    </Sheet>
  );
}
