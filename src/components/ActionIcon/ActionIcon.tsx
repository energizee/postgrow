import {
  Bike,
  Bus,
  CupSoda,
  Droplets,
  Flower2,
  Footprints,
  House,
  Leaf,
  Plug,
  Recycle,
  Salad,
  Shirt,
  ShowerHead,
  Sprout,
  Sun,
  Trash2,
  TreeDeciduous,
  Zap,
  type LucideIcon,
} from "lucide-react";
import "./ActionIcon.css";

const ICONS: Record<string, LucideIcon> = {
  "car-free-day": Bike,
  "active-trip": Footprints,
  "public-transport": Bus,
  compost: Sprout,
  recycling: Recycle,
  reusable: CupSoda,
  "line-dry": Shirt,
  "green-hour": Plug,
  "meat-free": Salad,
  "litter-pick": Trash2,
  "short-shower": ShowerHead,
  "plant-tree": TreeDeciduous,
  wildflowers: Flower2,
  "water-butt": Droplets,
  insulation: House,
  "green-tariff": Zap,
  solar: Sun,
};

const ICON_SIZE = 20;

export function ActionIcon({ actionId, lasting = false }: { actionId: string; lasting?: boolean }) {
  const Icon = ICONS[actionId] ?? Leaf;
  return (
    <span className={`action-icon ${lasting ? "action-icon--lasting" : ""}`} aria-hidden="true">
      <Icon size={ICON_SIZE} />
    </span>
  );
}
