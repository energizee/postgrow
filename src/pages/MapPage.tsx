import { useMemo, useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Map, type MapSector } from "../components/Map/Map";
import { SectorPreview, UnjoinedPreview, type UnjoinedSector } from "../components/SectorPreview/SectorPreview";
import { sectorShape } from "../lib/geo";
import { lookupPostcode, PostcodeError } from "../lib/postcodes";
import { buildProfile, fetchLiveValues } from "../lib/profile";
import { activeHouseholdIds, areaHouseholds, greenScore, scoreBand } from "../lib/scoring";
import { useMember, useStore } from "../store/context";
import type { LatLng } from "../types/types";
import "./MapPage.css";

const ICON_SIZE = 18;
const LEGEND = [
  { band: "low", label: "Under 40%" },
  { band: "mid", label: "40 to 69%" },
  { band: "high", label: "70% and up" },
];

const normaliseSector = (text: string) => text.trim().toUpperCase().replace(/\s+/g, " ");

export function MapPage() {
  const { state } = useStore();
  const { area: ownArea } = useMember();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<LatLng | null>(null);
  const [unjoined, setUnjoined] = useState<UnjoinedSector | null>(null);
  const [query, setQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  const sectors = useMemo<MapSector[]>(
    () =>
      state.areas.flatMap((area) => {
        const own = area.id === ownArea.id;
        if (!own && activeHouseholdIds(state, area.id).size === 0) return [];
        const shape = sectorShape(areaHouseholds(state, area.id).map((h) => h.location));
        return shape ? [{ id: area.id, shape, own, band: scoreBand(greenScore(state, area).green) }] : [];
      }),
    [state, ownArea.id],
  );

  function select(id: string | null) {
    setSelectedId(id);
    if (id) setUnjoined(null);
  }

  function showSector(id: string) {
    const area = state.areas.find((a) => a.id === id);
    const households = areaHouseholds(state, id);
    select(id);
    setFocus(households[0]?.location ?? area?.center ?? null);
  }

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    const text = normaliseSector(query);
    if (!text) return;
    setSearchError("");

    if (sectors.some((s) => s.id === text)) return showSector(text);

    setSearching(true);
    try {
      const lookup = await lookupPostcode(text);
      if (sectors.some((s) => s.id === lookup.sector)) return showSector(lookup.sector);
      setSelectedId(null);
      setFocus(lookup.location);
      setUnjoined({ id: lookup.sector, location: lookup.location, profile: null });
      const live = await fetchLiveValues(lookup.location, lookup.outcode);
      setUnjoined((current) => (current?.id === lookup.sector ? { ...current, profile: buildProfile(live) } : current));
    } catch (error) {
      setSearchError(error instanceof PostcodeError ? error.message : "Search failed. Try again.");
    } finally {
      setSearching(false);
    }
  }

  const selectedArea = state.areas.find((a) => a.id === selectedId);

  return (
    <div className="map-page">
      <h1 className="visually-hidden">Map</h1>
      <Map
        sectors={sectors}
        centre={ownArea.center}
        focus={focus}
        selectedId={selectedId}
        pin={unjoined?.location ?? null}
        onSelect={select}
      />

      <form className="map-search" role="search" onSubmit={handleSearch}>
        <Search size={ICON_SIZE} className="map-search__icon" aria-hidden="true" />
        <label htmlFor="map-search" className="visually-hidden">
          Search a postcode
        </label>
        <input
          id="map-search"
          className="map-search__input"
          type="search"
          placeholder="Search a postcode"
          autoComplete="postal-code"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-invalid={Boolean(searchError)}
          aria-describedby={searchError ? "map-search-error" : undefined}
        />
        {searching && <span className="map-search__spinner" aria-label="Searching" />}
        {searchError && (
          <p id="map-search-error" className="map-search__error" role="alert">
            {searchError}
          </p>
        )}
      </form>

      {!selectedArea && !unjoined && (
        <ul className="map-legend" aria-label="Green score">
          {LEGEND.map((item) => (
            <li key={item.band}>
              <span className={`map-legend__swatch sector--${item.band}`} />
              {item.label}
            </li>
          ))}
        </ul>
      )}

      {selectedArea && <SectorPreview area={selectedArea} onClose={() => select(null)} />}
      {unjoined && <UnjoinedPreview sector={unjoined} onClose={() => setUnjoined(null)} />}
    </div>
  );
}
