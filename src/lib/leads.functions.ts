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
    results?: Array<{
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
    }>;
  };
  if (data.status !== "OK" || !data.results?.length) {
    throw new Error(`Could not find location "${location}" (${data.status})`);
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
};

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

    // Use Places API (New) Nearby/Text Search v1
    const fieldMask = [
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
    ].join(",");

    const body = data.keyword.trim()
      ? {
          textQuery: `${data.keyword} near ${center.label}`,
          locationBias: {
            circle: {
              center: { latitude: center.lat, longitude: center.lng },
              radius: data.radiusKm * 1000,
            },
          },
          maxResultCount: 20,
        }
      : null;

    const allPlaces: PlaceV1[] = [];

    if (body) {
      const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        return {
          leads: [],
          totalScanned: 0,
          withoutWebsite: 0,
          locationLabel: center.label,
          error: `Google Places error (${res.status}): ${txt.slice(0, 200)}`,
        };
      }
      const json = (await res.json()) as { places?: PlaceV1[] };
      allPlaces.push(...(json.places ?? []));
    } else {
      // Generic nearby search across business categories
      const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": fieldMask,
        },
        body: JSON.stringify({
          includedTypes: ["restaurant", "cafe", "bar", "lodging", "store", "beauty_salon", "gym"],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: { latitude: center.lat, longitude: center.lng },
              radius: Math.min(data.radiusKm * 1000, 50000),
            },
          },
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        return {
          leads: [],
          totalScanned: 0,
          withoutWebsite: 0,
          locationLabel: center.label,
          error: `Google Places error (${res.status}): ${txt.slice(0, 200)}`,
        };
      }
      const json = (await res.json()) as { places?: PlaceV1[] };
      allPlaces.push(...(json.places ?? []));
    }

    const withoutSite = allPlaces.filter((p) => !p.websiteUri);

    const leads: Lead[] = withoutSite.map((p) => ({
      id: p.id,
      name: p.displayName?.text ?? "Unknown business",
      address: p.formattedAddress ?? "",
      phone: p.internationalPhoneNumber ?? p.nationalPhoneNumber ?? null,
      rating: p.rating ?? null,
      userRatingCount: p.userRatingCount ?? null,
      types: p.types ?? [],
      mapsUrl: p.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${p.id}`,
    }));

    return {
      leads,
      totalScanned: allPlaces.length,
      withoutWebsite: leads.length,
      locationLabel: center.label,
    };
  });
