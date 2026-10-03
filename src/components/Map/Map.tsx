import { useEffect } from "react";
import { CircleMarker, MapContainer, Polygon, TileLayer, Tooltip, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import { DomEvent, type LeafletMouseEvent } from "leaflet";
import type { ScoreBand } from "../../lib/scoring";
import type { LatLng } from "../../types/types";
import "./Map.css";

export type MapSector = {
  id: string;
  shape: [number, number][];
  band: ScoreBand;
  own: boolean;
};

type MapProps = {
  sectors: MapSector[];
  centre: LatLng;
  focus: LatLng | null; // flies here when it changes
  selectedId: string | null;
  pin: LatLng | null; // a searched postcode with no sector yet
  onSelect: (id: string | null) => void;
};

const START_ZOOM = 13;
const FOCUS_ZOOM = 15;
const PIN_RADIUS = 10;
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function FlyTo({ target }: { target: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), FOCUS_ZOOM));
  }, [map, target]);
  return null;
}

function BackgroundClick({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick });
  return null;
}

export const Map = ({ sectors, centre, focus, selectedId, pin, onSelect }: MapProps) => {
  return (
    <MapContainer center={[centre.lat, centre.lng]} zoom={START_ZOOM} zoomControl={false} className="map">
      <TileLayer attribution={ATTRIBUTION} url={TILES} />
      <ZoomControl position="topright" />
      <FlyTo target={focus} />
      <BackgroundClick onClick={() => onSelect(null)} />
      {sectors.map((sector) => {
        const selected = sector.id === selectedId;
        const classes = ["sector", `sector--${sector.band}`, sector.own && "sector--own", selected && "sector--selected"];
        return (
          <Polygon
            key={`${sector.id}-${sector.band}-${selected}-${sector.shape.length}`}
            positions={sector.shape}
            pathOptions={{ className: classes.filter(Boolean).join(" ") }}
            eventHandlers={{
              click: (event: LeafletMouseEvent) => {
                DomEvent.stopPropagation(event);
                onSelect(sector.id);
              },
            }}
          >
            <Tooltip permanent direction="center" className="sector-label">
              {sector.id}
            </Tooltip>
          </Polygon>
        );
      })}
      {pin && <CircleMarker center={[pin.lat, pin.lng]} radius={PIN_RADIUS} pathOptions={{ className: "search-pin" }} />}
    </MapContainer>
  );
};
