import { MapContainer, TileLayer } from "react-leaflet";
import "./Map.css";

const DEFAULT_CENTRE: [number, number] = [55.95, -3.19]; // Edinburgh coordinates
const DEFAULT_ZOOM = 13; // Zoomed to show Edinburgh

export const Map = () => {
  return (
    <MapContainer center={DEFAULT_CENTRE} zoom={DEFAULT_ZOOM} className="map">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
};
