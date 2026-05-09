import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SearchSchema = z.object({
  location: z.string().min(2).max(200),
  radiusKm: z.number().min(1).max(50),
  keyword: z.string().max(100).optional().default(""),
});

export type Lead = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  rating: number | null;
  userRatingCount: number | null;
  types: string[];
  mapsUrl: string;
  businessStatus: string | null;
};

export type SearchResult = {
  leads: Lead[];
  totalScanned: number;
  withoutWebsite: number;
  locationLabel: string;
  error?: string;
};

async function geocode(location: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = (await res.json()) as {
    status: string;
    error_message?: string;
    results?: Array<{
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
    }>;
  };
  if (data.status !== "OK" || !data.results?.length) {
    throw new Error(
      `Could not find location "${location}" (${data.status}${data.error_message ? `: ${data.error_message}` : ""})`,
    );
  }
  const r = data.results[0];
  return {
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    label: r.formatted_address,
  };
}

type PlaceV1 = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  googleMapsUri?: string;
  businessStatus?: string;
};

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.internationalPhoneNumber",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.types",
  "places.googleMapsUri",
  "places.businessStatus",
  "nextPageToken",
].join(",");

// Wider, deduped category set for generic discovery
const NEARBY_TYPE_GROUPS: string[][] = [
  ["restaurant", "cafe", "bakery", "bar", "meal_takeaway"],
  ["lodging"],
  ["store", "clothing_store", "shoe_store", "jewelry_store", "furniture_store", "home_goods_store"],
  ["beauty_salon", "hair_care", "spa", "nail_salon"],
  ["gym", "physiotherapist"],
  ["car_repair", "car_wash", "car_dealer"],
  ["plumber", "electrician", "painter", "roofing_contractor", "locksmith", "moving_company"],
  ["dentist", "doctor", "veterinary_care"],
  ["real_estate_agency", "insurance_agency", "lawyer", "accounting"],
  ["pet_store", "florist", "book_store"],
];

async function searchText(
  apiKey: string,
  textQuery: string,
  center: { lat: number; lng: number },
  radiusM: number,
  pageToken?: string,
): Promise<{ places: PlaceV1[]; nextPageToken?: string; error?: string }> {
  const body: Record<string, unknown> = {
    textQuery,
    locationBias: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: radiusM,
      },
    },
    maxResultCount: 20,
  };
  if (pageToken) body.pageToken = pageToken;
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    return { places: [], error: `Google Places error (${res.status}): ${txt.slice(0, 200)}` };
  }
  const json = (await res.json()) as { places?: PlaceV1[]; nextPageToken?: string };
  return { places: json.places ?? [], nextPageToken: json.nextPageToken };
}

async function searchNearby(
  apiKey: string,
  includedTypes: string[],
  center: { lat: number; lng: number },
  radiusM: number,
): Promise<{ places: PlaceV1[]; error?: string }> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes,
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: {
          center: { latitude: center.lat, longitude: center.lng },
          radius: Math.min(radiusM, 50000),
        },
      },
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    return { places: [], error: `Google Places error (${res.status}): ${txt.slice(0, 200)}` };
  }
  const json = (await res.json()) as { places?: PlaceV1[] };
  return { places: json.places ?? [] };
}

export const searchLeads = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SearchSchema.parse(input))
  .handler(async ({ data }): Promise<SearchResult> => {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return {
        leads: [],
        totalScanned: 0,
        withoutWebsite: 0,
        locationLabel: "",
        error: "GOOGLE_PLACES_API_KEY is not configured",
      };
    }

    let center: { lat: number; lng: number; label: string };
    try {
      center = await geocode(data.location, apiKey);
    } catch (e) {
      return {
        leads: [],
        totalScanned: 0,
        withoutWebsite: 0,
        locationLabel: "",
        error: e instanceof Error ? e.message : "Geocoding failed",
      };
    }

    const radiusM = data.radiusKm * 1000;
    const byId = new Map<string, PlaceV1>();
    let firstError: string | undefined;

    if (data.keyword.trim()) {
      // Paginate up to 3 pages (Places API max ~60 results)
      let token: string | undefined;
      for (let page = 0; page < 3; page++) {
        const { places, nextPageToken, error } = await searchText(
          apiKey,
          `${data.keyword} in ${center.label}`,
          center,
          radiusM,
          token,
        );
        if (error && !firstError) firstError = error;
        for (const p of places) byId.set(p.id, p);
        if (!nextPageToken) break;
        token = nextPageToken;
        // Google requires a brief delay before pageToken is valid
        await new Promise((r) => setTimeout(r, 1500));
      }
    } else {
      // Fan out across category groups in parallel
      const results = await Promise.all(
        NEARBY_TYPE_GROUPS.map((types) => searchNearby(apiKey, types, center, radiusM)),
      );
      for (const { places, error } of results) {
        if (error && !firstError) firstError = error;
        for (const p of places) byId.set(p.id, p);
      }
    }

    const all = Array.from(byId.values()).filter(
      (p) => p.businessStatus !== "CLOSED_PERMANENTLY",
    );

    const withoutSite = all.filter((p) => !p.websiteUri || p.websiteUri.trim() === "");

    const leads: Lead[] = withoutSite.map((p) => ({
      id: p.id,
      name: p.displayName?.text ?? "Unknown business",
      address: p.formattedAddress ?? "",
      phone: p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? null,
      rating: p.rating ?? null,
      userRatingCount: p.userRatingCount ?? null,
      types: p.types ?? [],
      mapsUrl: p.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${p.id}`,
      businessStatus: p.businessStatus ?? null,
    }));

    // Sort: phone first (actionable), then by review count
    leads.sort((a, b) => {
      if (!!a.phone !== !!b.phone) return a.phone ? -1 : 1;
      return (b.userRatingCount ?? 0) - (a.userRatingCount ?? 0);
    });

    return {
      leads,
      totalScanned: all.length,
      withoutWebsite: leads.length,
      locationLabel: center.label,
      error: leads.length === 0 && firstError ? firstError : undefined,
    };
  });
