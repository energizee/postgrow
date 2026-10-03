import type { LatLng, PostcodeArea } from "../types/types";

const API = "https://api.postcodes.io/postcodes";
const COUNTRIES = ["England", "Wales", "Scotland", "Northern Ireland"] as const;

export type PostcodeLookup = {
  postcode: string; // "EH6 6QU"
  outcode: string; // "EH6"
  sector: string; // "EH6 6"
  location: LatLng;
  geography: PostcodeArea["geography"];
};

type PostcodesIoResult = {
  postcode: string;
  outcode: string;
  incode: string;
  latitude: number | null;
  longitude: number | null;
  country: string;
  region: string | null;
  codes: { lsoa: string; msoa: string; admin_ward: string; admin_district: string };
};

export class PostcodeError extends Error {}

export async function lookupPostcode(input: string): Promise<PostcodeLookup> {
  const postcode = input.trim().toUpperCase();
  if (!postcode) throw new PostcodeError("Enter a postcode");

  let response: Response;
  try {
    response = await fetch(`${API}/${encodeURIComponent(postcode)}`);
  } catch {
    throw new PostcodeError("Can't reach the postcode service. Check your connection.");
  }
  if (!response.ok) throw new PostcodeError("Postcode not found. Check it and try again.");

  const { result } = (await response.json()) as { result: PostcodesIoResult };
  if (result.latitude === null || result.longitude === null) {
    throw new PostcodeError("That postcode has no location yet. Try a neighbouring one.");
  }

  const country = COUNTRIES.find((c) => c === result.country) ?? "England";
  return {
    postcode: result.postcode,
    outcode: result.outcode,
    sector: `${result.outcode} ${result.incode[0]}`,
    location: { lat: result.latitude, lng: result.longitude },
    geography: {
      lsoaCodes: [result.codes.lsoa],
      msoaCodes: [result.codes.msoa],
      wardCode: result.codes.admin_ward,
      localAuthorityCode: result.codes.admin_district,
      region: result.region ?? result.country,
      country,
    },
  };
}
