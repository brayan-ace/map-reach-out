import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type { SearchResult } from "./leads.functions";

export type SavedSearch = {
  id: string;
  name: string;
  location: string;
  keyword: string;
  radius: number;
  savedAt: number;
  result?: SearchResult;
};

const userDocRef = (uid: string) => doc(getDb(), "users", uid);
const savedColRef = (uid: string) => collection(getDb(), "users", uid, "savedSearches");
const savedDocRef = (uid: string, id: string) =>
  doc(getDb(), "users", uid, "savedSearches", id);

// ---- Onboarding ----

export async function getOnboardingStatus(uid: string): Promise<{
  completed: boolean;
  profile?: Record<string, unknown>;
}> {
  const snap = await getDoc(userDocRef(uid));
  if (!snap.exists()) return { completed: false };
  const data = snap.data();
  return { completed: !!data.onboardingCompletedAt, profile: data };
}

export async function completeOnboarding(
  uid: string,
  data: {
    role?: string;
    goal?: string;
    region?: string;
    signature?: string;
    displayName?: string;
  },
) {
  await setDoc(
    userDocRef(uid),
    {
      ...data,
      onboardingCompletedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

// ---- Saved searches (Firestore + localStorage cache) ----

const cacheKey = (uid: string) => `leadfinder.saved.v2.${uid}`;

export function loadSavedCache(uid: string): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(cacheKey(uid)) ?? "[]");
  } catch {
    return [];
  }
}

function writeCache(uid: string, list: SavedSearch[]) {
  try {
    localStorage.setItem(cacheKey(uid), JSON.stringify(list));
  } catch {
    /* quota — ignore */
  }
}

export async function fetchSavedSearches(uid: string): Promise<SavedSearch[]> {
  const q = query(savedColRef(uid), orderBy("savedAt", "desc"));
  const snap = await getDocs(q);
  const list: SavedSearch[] = snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      id: d.id,
      name: data.name,
      location: data.location,
      keyword: data.keyword ?? "",
      radius: data.radius ?? 10,
      savedAt: data.savedAt ?? 0,
      result: data.result,
    };
  });
  writeCache(uid, list);
  return list;
}

export async function saveSavedSearch(uid: string, entry: SavedSearch): Promise<void> {
  await setDoc(savedDocRef(uid, entry.id), {
    name: entry.name,
    location: entry.location,
    keyword: entry.keyword,
    radius: entry.radius,
    savedAt: entry.savedAt,
    result: entry.result ?? null,
  });
}

export async function updateSavedResult(
  uid: string,
  id: string,
  result: SearchResult,
): Promise<void> {
  try {
    await updateDoc(savedDocRef(uid, id), { result });
  } catch {
    /* doc may not exist — ignore */
  }
}

export async function deleteSavedSearch(uid: string, id: string): Promise<void> {
  await deleteDoc(savedDocRef(uid, id));
}

export function persistCache(uid: string, list: SavedSearch[]) {
  writeCache(uid, list);
}
