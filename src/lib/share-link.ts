function buildLink(path: string, params: Record<string, string>): string {
  const url = new URL(path, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.href;
}

export function buildShareLink(encodedProfile: string): string {
  return buildLink("/results", { p: encodedProfile });
}

export function buildPackLink(routeId: string, encodedProfile?: string): string {
  return buildLink("/pack", {
    ...(encodedProfile ? { p: encodedProfile } : {}),
    route: routeId,
  });
}
