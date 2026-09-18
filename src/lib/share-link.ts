export function buildShareLink(encodedProfile: string): string {
  const url = new URL("/results", window.location.origin);
  url.searchParams.set("p", encodedProfile);
  return url.href;
}