export const MS_PER_MINUTE = 60_000;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;

export function daysSince(iso: string, now: number): number {
  return (now - Date.parse(iso)) / MS_PER_DAY;
}

export function hoursSince(iso: string, now: number): number {
  return (now - Date.parse(iso)) / MS_PER_HOUR;
}

export function dayKey(date: Date | string | number): string {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function shiftDayKey(key: string, days: number): string {
  const [year, month, day] = key.split("-").map(Number);
  return dayKey(new Date(year, month - 1, day + days));
}

export const previousDayKey = (key: string) => shiftDayKey(key, -1);
export const nextDayKey = (key: string) => shiftDayKey(key, 1);

const relative = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto", style: "short" });

export function timeAgo(iso: string, now = Date.now()): string {
  const elapsed = now - Date.parse(iso);
  if (elapsed < MS_PER_MINUTE) return "just now";
  if (elapsed < MS_PER_HOUR) return relative.format(-Math.round(elapsed / MS_PER_MINUTE), "minute");
  if (elapsed < MS_PER_DAY) return relative.format(-Math.round(elapsed / MS_PER_HOUR), "hour");
  return relative.format(-Math.round(elapsed / MS_PER_DAY), "day");
}

const dateTime = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const dayOfMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric" });
const shortMonth = new Intl.DateTimeFormat("en-GB", { month: "short" });

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDayOfMonth = (iso: string) => dayOfMonth.format(new Date(iso));
export const formatShortMonth = (iso: string) => shortMonth.format(new Date(iso));
