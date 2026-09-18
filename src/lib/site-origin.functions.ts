import { createServerFn } from "@tanstack/react-start";

/**
 * The origin of the incoming request, used to build absolute URLs the same way
 * /sitemap.xml and /robots.txt do. Never hardcode a domain.
 */
export const getRequestOrigin = createServerFn().handler(async () => {
  const { getRequest } = await import("@tanstack/react-start/server");
  return new URL(getRequest().url).origin;
});

export async function resolveOrigin(): Promise<string> {
  if (typeof window !== "undefined") return window.location.origin;
  return await getRequestOrigin();
}
