import type { ContributionAction, ContributionImpact, ProfileCategory } from "../types/types";

export const ACTIONS: ContributionAction[] = [
  { id: "car-free-day", name: "Car-free day", category: "transport", basePoints: 8, impact: "habit", dailyCap: 1 },
  { id: "active-trip", name: "Walked or cycled a trip", category: "transport", basePoints: 4, impact: "habit", dailyCap: 3 },
  { id: "public-transport", name: "Took public transport", category: "transport", basePoints: 4, impact: "habit", dailyCap: 2 },
  { id: "compost", name: "Composted food waste", category: "waste", basePoints: 4, impact: "habit", dailyCap: 1 },
  { id: "recycling", name: "Sorted the recycling", category: "waste", basePoints: 3, impact: "habit", dailyCap: 1 },
  { id: "reusable", name: "Used a refill or reusable", category: "waste", basePoints: 2, impact: "habit", dailyCap: 3 },
  { id: "line-dry", name: "Line-dried laundry", category: "energy", basePoints: 4, impact: "habit", dailyCap: 1 },
  { id: "green-hour", name: "Ran appliances in a green hour", category: "energy", basePoints: 4, impact: "habit", dailyCap: 2 },
  { id: "meat-free", name: "Meat-free day", category: "nature", basePoints: 5, impact: "habit", dailyCap: 1 },
  { id: "litter-pick", name: "Picked up litter", category: "nature", basePoints: 6, impact: "habit", dailyCap: 1 },
  { id: "short-shower", name: "Shower under five minutes", category: "water", basePoints: 3, impact: "habit", dailyCap: 1 },
  { id: "plant-tree", name: "Planted a tree", category: "nature", basePoints: 40, impact: "lasting" },
  { id: "wildflowers", name: "Sowed a wildflower patch", category: "nature", basePoints: 30, impact: "lasting" },
  { id: "water-butt", name: "Installed a water butt", category: "water", basePoints: 30, impact: "lasting" },
  { id: "insulation", name: "Insulated the loft or walls", category: "homes", basePoints: 60, impact: "lasting" },
  { id: "green-tariff", name: "Switched to a green energy tariff", category: "energy", basePoints: 40, impact: "lasting" },
  { id: "solar", name: "Installed solar panels", category: "energy", basePoints: 60, impact: "lasting" },
];

export const CATEGORY_NAMES: Record<ProfileCategory, string> = {
  air: "Air",
  energy: "Energy",
  homes: "Homes",
  nature: "Nature",
  transport: "Transport",
  water: "Water",
  waste: "Waste",
};

export function getAction(id: string): ContributionAction {
  const action = ACTIONS.find((a) => a.id === id);
  if (!action) throw new Error(`Unknown action ${id}`);
  return action;
}

export function actionsByImpact(impact: ContributionImpact): ContributionAction[] {
  return ACTIONS.filter((a) => a.impact === impact);
}
