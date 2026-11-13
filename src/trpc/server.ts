import "server-only";

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import type { AppRouter } from "@/server/routers/_app";
import { makeQueryClient } from "./query-client";

/** One QueryClient per request, shared by every Server Component in it. */
export const getQueryClient = cache(makeQueryClient);

/**
 * Server Components read tasks through the HTTP API instead of importing the
 * router directly.
 *
 * Tasks live in memory, and on serverless hosting each page and the API route
 * run as separate functions, each with its own memory. If pages read the array
 * directly they would see a different list from the one the API mutates.
 * Going through the API gives every read and write a single owner.
 */
function getBaseUrl() {
  // Set automatically by Vercel; the fallback covers local dev and `next start`.
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (productionHost) return `https://${productionHost}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export const serverClient = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: `${getBaseUrl()}/api/trpc` })],
});

/** Query options for prefetching in Server Components. */
export const trpc = createTRPCOptionsProxy({
  client: serverClient,
  queryClient: getQueryClient,
});
