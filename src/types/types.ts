// Scoring rules (all calculated in lib/, never stored):
//
//   Contribution points = basePoints, added instantly
//                         x1.5 once approved for habit actions (proof optional)
//                         x2 once approved for lasting actions (proof required)
//   Review points       = 2 per review, to the reviewer's household (no cap)
//
//   Leaderboard         = raw contribution + review points over the last 30 days (unbounded)
//
//   Profile %           = sum of metric points / sum of metric maxPoints (metrics without data are left out)
//   Earned %            = approved lasting contribution points per household / CONTRIBUTION_POTENTIAL x 100
//                         never expires, capped at EARNED_CAP_PERCENT
//   Floor %             = min(profile % + earned %, 100)
//   Momentum %          = all contribution + review points from the last 30 days, per household,
//                         each faded linearly from 100% on the day logged to 0% at day 30,
//                         / CONTRIBUTION_POTENTIAL x 100
//   Green score %       = floor % + min(momentum %, 100 - floor %)   -> map colour
//   Tree                = size from floor %, leaves from momentum %
//
// A household is active with at least one contribution in the last 30 days.
// Group activity proof is uploaded once by the organiser; approval applies the
// lasting or habit multiplier to every contribution linked to the activity.
//
// Proof reviews are anonymous both ways. Each request goes to a random other
// postcode area, the first person there to review it decides, and neither side
// is ever shown who (or where) the other is.

// Scoring constants

export const CONTRIBUTION_WINDOW_DAYS = 30; // leaderboard window + momentum fade length
export const HABIT_PROOF_MULTIPLIER = 1.5;
export const LASTING_PROOF_MULTIPLIER = 2;
export const REVIEW_POINTS = 2;
export const CONTRIBUTION_POTENTIAL = 700; // points per household for 100% (a very engaged household over 30 days)
export const EARNED_CAP_PERCENT = 20; // max permanent boost from lasting contributions
export const REVIEW_REASSIGN_HOURS = 48; // unreviewed proof moves to another sector after this

// Individuals 

export type LatLng = { lat: number; lng: number };

export type User = {
  id: string;
  name: string;
  postcode: string | null;
  location: LatLng | null; // from the postcode, never shown
  postcodeAreaId: string | null; // sector, set once the postcode is validated
  householdId: string | null; // null until they join or create a household
  createdAt: string; // ISO date
};

// Households

// Contribution score is derived from Contributions and Reviews.
export type Household = {
  id: string;
  name: string;
  postcodeAreaId: string;
  owner: string; // User id
  location: LatLng; // owner's postcode, used to draw the sector shape, never shown
  createdAt: string;
};

// Postcode areas

export type PostcodeArea = {
  id: string; // postcode sector, e.g. "SE15 4"
  outcode: string; // "SE15"
  center: LatLng;
  geography: {
    // From postcodes.io, used to join public datasets to this area
    lsoaCodes: string[];
    msoaCodes: string[];
    wardCode: string;
    localAuthorityCode: string;
    region: string;
    country: "England" | "Wales" | "Scotland" | "Northern Ireland";
  };
  householdCount: number | null; // total households in the sector (Census), for participation
  profile: AreaProfile | null;
  createdAt: string;
};

// Area profile (automatic public data) 

export type ProfileCategory =
  | "air"
  | "energy"
  | "homes"
  | "nature"
  | "transport"
  | "water"
  | "waste";

export type GeographyLevel =
  | "point"
  | "postcode"
  | "sector"
  | "outcode"
  | "lsoa"
  | "msoa"
  | "localAuthority"
  | "region";

export type AreaMetric = {
  id: string; // e.g. "no2", "epc-average", "green-space-pct"
  category: ProfileCategory;
  label: string;
  value: number | null; // raw value from the source
  unit: string; // "µg/m³", "%", "kWh"
  points: number | null; // 0 to maxPoints, higher = greener; null when there's no data
  maxPoints: number; // also acts as the metric's weight
  source: string;
  geographyLevel: GeographyLevel;
  fetchedAt: string;
};

export type AreaProfile = {
  metrics: AreaMetric[];
  categoryPoints: Partial<Record<ProfileCategory, { points: number; potential: number }>>;
  points: number; // sum of metric points (metrics with data only)
  potential: number; // sum of maxPoints (metrics with data only)
  percentage: number; // points / potential x 100 - the floor of the green score
  updatedAt: string;
};

// Contributions

// habit: only counts while you keep doing it (momentum, fades)
// lasting: a permanent change to the area. Proof required, permanently raises the floor once approved
export type ContributionImpact = "habit" | "lasting";

// Catalogue of things a household can log
export type ContributionAction = {
  id: string; // e.g. "car-free-day"
  name: string;
  category: ProfileCategory;
  basePoints: number;
  impact: ContributionImpact;
  dailyCap?: number; // habits only; lasting actions are once per household
};

export type ProofStatus = "none" | "pending" | "approved" | "rejected";

export type Proof = {
  image: string; // resized data URL; empty for seeded demo proofs
  status: Exclude<ProofStatus, "none">;
  assignedAreaId: string; // random other area that will review it
  assignedAt: string; // reassigned after REVIEW_REASSIGN_HOURS without a review
  reviewId: string | null; // set once someone in that area reviews it
  submittedAt: string;
};

export type Contribution = {
  id: string;
  actionId: string; // ContributionAction id
  userId: string;
  householdId: string;
  postcodeAreaId: string;
  basePoints: number; // copied from the action at log time, added instantly
  details: string;
  proof: Proof | null; // optional for habits, required for lasting actions (unless linked to an activity)
  activityId: string | null; // group activity this was part of
  createdAt: string;
};

// Group activities (bulletin board)

export type GroupActivity = {
  id: string;
  postcodeAreaId: string;
  organiserId: string; // User id
  title: string;
  actionId: string;
  date: string; // ISO date and time
  place: string;
  description: string;
  participantIds: string[]; // User ids
  proof: Proof | null; // uploaded by the organiser, applies to every linked contribution
  createdAt: string;
};

// Reviews

export type ReviewSubject = { kind: "contribution" | "activity"; id: string };

export type Review = {
  id: string;
  subject: ReviewSubject;
  reviewerUserId: string;
  reviewerHouseholdId: string;
  reviewerAreaId: string;
  decision: "approved" | "rejected";
  points: number; // awarded to the reviewer's household, counts on the leaderboard
  createdAt: string;
};

// App state (localStorage)

export type AppState = {
  users: User[];
  households: Household[];
  areas: PostcodeArea[];
  contributions: Contribution[];
  activities: GroupActivity[];
  reviews: Review[];
  currentUserId: string | null;
};
