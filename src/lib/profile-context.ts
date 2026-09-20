import { decodeProfile, encodeProfile, type Profile } from "@/engine";

export type ProfileContext = {
  profile: Profile;
  hasJobOffer: boolean | undefined;
  universityCountry: string | undefined;
};

type ProfileAnswers = {
  hasJobOffer?: boolean;
  universityCountry?: string;
};

function readEncodedObject(encoded: string): Record<string, unknown> | null {
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    const text = new TextDecoder().decode(
      Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    );
    const value: unknown = JSON.parse(text);
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function encodeProfileContext(profile: Profile, answers: ProfileAnswers): string {
  return encodeProfile({ ...profile, ...answers });
}

export function decodeProfileContext(encoded: string): ProfileContext | null {
  const profile = decodeProfile(encoded);
  const raw = readEncodedObject(encoded);
  if (!profile || !raw) return null;

  return {
    profile,
    hasJobOffer: typeof raw["hasJobOffer"] === "boolean" ? raw["hasJobOffer"] : undefined,
    universityCountry:
      typeof raw["universityCountry"] === "string" ? raw["universityCountry"] : undefined,
  };
}
