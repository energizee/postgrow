import { hashString } from "../../lib/random";
import "./Avatar.css";

const TONES = ["sprout", "heartwood", "twig"];
const DEFAULT_SIZE = 40;
const LETTER_SCALE = 0.42;

export function Avatar({ name, size = DEFAULT_SIZE }: { name: string; size?: number }) {
  const tone = TONES[hashString(name) % TONES.length];
  return (
    <span className={`avatar avatar--${tone}`} style={{ width: size, height: size, fontSize: size * LETTER_SCALE }} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
