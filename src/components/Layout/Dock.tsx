import { House, Map, Megaphone, Plus, Trophy } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const ICON_SIZE = 22;
const ADD_ICON_SIZE = 26;

const LEFT = [
  { to: "/", label: "Map", Icon: Map, end: true },
  { to: "/leaderboards", label: "Leaderboard", Icon: Trophy, end: false },
];
const RIGHT = [
  { to: "/bulletin", label: "Bulletin", Icon: Megaphone, end: false },
  { to: "/household", label: "Household", Icon: House, end: false },
];

function DockLink({ to, label, Icon, end }: (typeof LEFT)[number]) {
  return (
    <NavLink to={to} end={end} className="dock__link">
      <Icon size={ICON_SIZE} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}

export function Dock() {
  return (
    <nav className="dock" aria-label="Main">
      {LEFT.map((item) => (
        <DockLink key={item.to} {...item} />
      ))}
      <Link to="/contribute" className="dock__add" aria-label="Add contribution">
        <Plus size={ADD_ICON_SIZE} strokeWidth={2.5} aria-hidden="true" />
      </Link>
      {RIGHT.map((item) => (
        <DockLink key={item.to} {...item} />
      ))}
    </nav>
  );
}
